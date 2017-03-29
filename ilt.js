/**
 * Created by ck on 27/03/2017.
 */
const kmeans = require('ml-kmeans');
const core = require('./core').core;

class ILT {
    constructor(topk, k, df = 0) {
        this.clusters = {};
        this.topk = topk;
        this.K = k;
        this.distanceFactor = df;
        this.initialize();
    }

    initialize() {
        console.log('start ilt initialing at:' + new Date().toLocaleTimeString());
        for (let u = 0; u < core.data.users.length; u++) {
            let user = core.data.users[u];
            user.positives = 0;
            user.negatives = 0;
        }
        for (let i = 0; i < core.data.services.length; i++) {
            let maxCluster = this.getServiceCluster(i);
            if (maxCluster === null) continue;
            for (let u = 0; u < core.data.users.length; u++) {
                let user = core.data.users[u];
                let qos = [core.data.rtMatrix[u][i], core.data.tpMatrix[u][i]];
                if (Math.abs(qos[0] - maxCluster.centroid[0]) <= 3 * maxCluster.result.sdx
                    && Math.abs(qos[1] - maxCluster.centroid[1]) <= 3 * maxCluster.result.sdy) {
                    user.positives++;
                } else { //negative
                    user.negatives++;
                }
            }
        }
        console.log('ilt initialized at:' + new Date().toLocaleTimeString());
    }

    getServiceCluster(i) {
        let data = [];
        let centers = [];
        let users = [];
        for (let u = 0; u < core.data.users.length; u++) {
            if (core.data.rtMatrix[u][i] !== -1 && core.data.tpMatrix[u][i] !== -1)
                users.push(core.data.users[u]);
        }
        if (users.length === 0) return null;
        for (let u = 0; u < users.length; u++) {
            let rt = core.data.rtMatrix[users[u].id][i];
            let tp = core.data.tpMatrix[users[u].id][i];
            data.push([rt, tp]);
        }
        let k = this.K;
        if (k > users.length)
            k = users.length;

        for (let i = 0; i < k; i++) {
            centers.push(data[i]);
        }
        //k-means 聚类
        let clusters = kmeans(data, k, {initialization: centers});
        //找到最大数量的类
        let centros = clusters.centroids;
        for (let i = 0; i < centros.length; i++) {
            centros[i].index = i;
        }
        centros.sort(function (a, b) {
            return b.size - a.size || -1;
        });
        let maxCluster = centros[0];
        //计算聚类的中心和标准差

        maxCluster.result = {x: 0, y: 0, sdx: 0, sdy: 0};
        for (let i = 0; i < clusters.clusters.length; i++) {
            let index = clusters.clusters[i];
            if (index !== maxCluster.index) continue;
            maxCluster.result.x += Math.pow(data[i][0] - maxCluster.centroid[0], 2);
            maxCluster.result.y += Math.pow(data[i][1] - maxCluster.centroid[1], 2);
        }
        maxCluster.result.sdx = Math.sqrt(maxCluster.result.x / maxCluster.size);
        maxCluster.result.sdy = Math.sqrt(maxCluster.result.y / maxCluster.size);
        return maxCluster;
    }


    /**
     * 计算服务相似度 PCC
     * @param i 服务id
     * @param j 服务id
     * @param m rtMatrix/tpMatrix
     * @returns {number}
     */
    getSim(i, j, m) {
        let users = core.getBothActivatedUser(i, j, m);
        let averageA = core.data.services[i].averageQoS[m];
        let averageB = core.data.services[j].averageQoS[m];
        let sum1 = 0, sum2 = 0, sum3 = 0;
        for (let u = 0; u < users.length; u++) {
            let user = users[u];
            let x1 = core.data[m][user.id][i] - averageA;
            let x2 = core.data[m][user.id][j] - averageB;
            let w = (user.positives + 1) / (user.positives + user.negatives + 2);
            sum1 += (x1 * x2) * w;
            sum2 += (x1 * x1) * w;
            sum3 += (x2 * x2) * w;
        }
        let sim = (sum2 === 0 || sum3 === 0) ? -1 : sum1 / (Math.sqrt(sum2) * Math.sqrt(sum3));
        return sim > 1 ? 1 : sim;
    }

    /**
     *用户u使用过的且与服务i距离最近且又相似的前k个服务
     * @param u 用户id
     * @param i 服务id
     * @param m rtMatrix/tpMatrix
     */
    getTopKServices(u, i, m) {
        let servicesAll = core.data.users[u].services[m];
        let as = core.data.services[i].as;
        let country = core.data.services[i].country;
        let services = servicesAll.filter(function (x) {
            return x.as === as;
        });
        if (services.length === 0) {
            services = servicesAll.filter(function (x) {
                return x.country === country;
            });
        }
        if (services.length === 0) {
            services = servicesAll;
        }
        let arr = [];
        if (services.length < this.topk) {
            return services.map(function (x) {
                return {service: x};
            });
        }
        for (let j = 0; j < services.length; j++) {
            let service = services[j];
            if (service.id === i) continue;
            let sim = this.getSim(i, service.id, m);
            arr.push({service: service, sim: sim});
        }
        arr.sort(function (a, b) {
            return b.sim - a.sim || -2;
        });
        if (this.topk < arr.length)
            arr.splice(this.topk, arr.length - this.topk);
        return arr;
    }

    /**
     * 获取用户u对于服务i的QoS预测值
     * @param u 用户id
     * @param i 服务id
     * @param m rtMatrix/tpMatrix
     */
    getPrediction(u, i, m) {
        let averageA = core.data.services[i].averageQoS[m];
        let topSimServices = this.getTopKServices(u, i, m);
        let x1 = 0, sum = 0;
        for (let j = 0; j < topSimServices.length; j++) {
            let simService = topSimServices[j].service;
            let averageSimService = simService.averageQoS[m];
            let sim = this.getSim(simService.id, i, m);
            x1 += (core.data[m][u][simService.id] - averageSimService) * sim;
            sum += sim;
        }
        x1 /= sum;
        x1 += averageA;
        return x1;
    }
}
module.exports = ILT;