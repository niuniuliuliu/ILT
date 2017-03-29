/**
 * Created by ck on 26/03/2017.
 */
const core = require('./core').core;
class IPCC {
    constructor(topk) {
        this.topk = topk;
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
            sum1 += (x1 * x2);
            sum2 += (x1 * x1);
            sum3 += (x2 * x2);
        }
        let sim = (sum2 === 0 || sum3 === 0) ? -1 : sum1 / (Math.sqrt(sum2) * Math.sqrt(sum3));
        return sim > 1 ? 1 : sim < -1 ? -1 : sim;
    }

    /**
     * 获取基于PCC相似度的 用户u使用过的且与服务i相似的前k个服务
     * @param u 用户id
     * @param i 服务id
     * @param m rtMatrix/tpMatrix
     */
    getTopKServices(u, i, m) {
        let services = core.data.users[u].services[m];
        let arr = [];
        for (let j = 0; j < services.length; j++) {
            let service = services[j];
            if (service.id === i) continue;
            let sim = this.getSim(service.id, i, m);
            arr.push({service: service, sim: sim});
        }
        arr.sort(function (a, b) {
            return b.sim - a.sim || -1;
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
module.exports = IPCC;