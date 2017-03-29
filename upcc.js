/**
 * Created by ck on 26/03/2017.
 */
const core = require('./core').core;
class UPCC {
    constructor(topk) {
        this.topk = topk;
    }

    /**
     * 计算用户相似度 PCC
     * @param u 用户id
     * @param v 用户id
     * @param m rtMatrix/tpMatrix
     * @returns {number}
     */
    getSim(u, v, m) {
        let services = core.getBothActivatedService(u, v, m);
        let averageA = core.data.users[u].averageQoS[m];
        let averageB = core.data.users[v].averageQoS[m];
        let sum1 = 0, sum2 = 0, sum3 = 0;
        for (let i = 0; i < services.length; i++) {
            let service = services[i];
            let x1 = core.data[m][u][service.id] - averageA;
            let x2 = core.data[m][v][service.id] - averageB;
            sum1 += x1 * x2
            sum2 += (x1 * x1);
            sum3 += (x2 * x2);
        }
        let sim = sum1 / (Math.sqrt(sum2) * Math.sqrt(sum3));
        return sim > 1 ? 1 : sim < -1 ? -1 : sim;
    }

    /**
     * 获取基于PCC相似度的 与用户u相似的且使用过服务i的前k个用户
     * @param 用户u id
     * @param 服务i id
     * @param m rtMatrix/tpMatrix
     */
    getTopKUsers(u, i, m) {
        let users = core.data.services[i].users[m];
        let arr = [];
        for (let n = 0; n < users.length; n++) {
            let user = users[n];
            if (user.id === u) continue;
            let sim = this.getSim(u, user.id, m);
            arr.push({user: user, sim: sim});
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
        let averageA = core.data.users[u].averageQoS[m];
        let topSimUsers = this.getTopKUsers(u, i, m);
        let x1 = 0, sum = 0;
        for (let n = 0; n < topSimUsers.length; n++) {
            let simUser = topSimUsers[n].user;
            let averageSimUser = simUser.averageQoS[m];
            let sim = this.getSim(u, simUser.id, m);
            x1 += ((core.data[m][simUser.id][i] - averageSimUser) * sim);
            sum += sim;
        }
        x1 /= sum;
        x1 += averageA;
        return x1
    }
}
module.exports = UPCC;