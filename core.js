/**
 * Created by ck on 23/03/2017.
 */
const fs = require('fs');
const User = require('./user');
const Service = require('./service');
const euclidean = require('ml-distance-euclidean');
exports.core = {
    parameters: {
        maxDistance: 402 //Math.sqrt(180 * 180 + 360 * 360)
    },
    data: {
        users: [],
        services: [],
        rtMatrix: [],
        tpMatrix: [],
        removedArray: [],
        rt: 'rtMatrix',
        tp: 'tpMatrix'
    },
    readUsers() {
        let data = fs.readFileSync('dataset1/userlist.txt', 'utf-8');
        let arr = data.split(/\r?\n/ig);
        let len = arr.length;
        for (let i = 2; i < len; i++) {
            let line = arr[i];
            let subArr = line.split('\t');
            if (subArr.length !== 7) continue;
            this.data.users.push(new User(subArr[0], subArr[1], subArr[2], subArr[4], subArr[5], subArr[6]));
        }
    },
    readServices() {
        let data = fs.readFileSync('dataset1/wslist.txt', 'utf-8');
        let arr = data.split(/\r?\n/ig);
        let len = arr.length;
        for (let i = 2; i < len; i++) {
            let line = arr[i];
            let subArr = line.split('\t');
            if (subArr.length !== 9) continue;
            let service = new Service(subArr[0], subArr[3], subArr[4], subArr[6], subArr[7], subArr[8]);
            this.data.services.push(service);
        }
    },
    readRTMatrix() {
        let data = fs.readFileSync('dataset1/rtMatrix.txt', 'utf-8');
        let arr = data.split(/\r?\n/ig);
        let len = arr.length;
        for (let i = 0; i < len; i++) {
            let line = arr[i];
            line = line.substring(0, line.length - 1);
            let subArr = line.split('\t');
            this.data.rtMatrix.push(subArr.map(function (x) {
                return Number(x);
            }));
        }
    },
    readTPMatrix() {
        let data = fs.readFileSync('dataset1/tpMatrix.txt', 'utf-8');
        let arr = data.split(/\r?\n/ig);
        let len = arr.length;
        for (let i = 0; i < len; i++) {
            let line = arr[i];
            line = line.substring(0, line.length - 1);
            let subArr = line.split('\t');
            this.data.tpMatrix.push(subArr.map(function (x) {
                return Number(x);
            }));
        }
    },
    setMatrixDensity(density){
        let originalArray = [];
        let count = Math.ceil((1 - density) * this.data.users.length);
        for (let i = 0; i < this.data.users.length; i++) {
            originalArray[i] = i;
        }
        originalArray.sort(function () {
            return 0.5 - Math.random();
        });
        originalArray.splice(count, originalArray.length - count);
        this.data.removedArray = originalArray;
        for (let i = 0; i < count; i++) {
            let index = originalArray[i];
            this.data.tpMatrix[index] = this.data.tpMatrix[index].map(function (x) {
                return -1;
            });
            this.data.rtMatrix[index] = this.data.rtMatrix[index].map(function (x) {
                return -1;
            });
        }
    },
    calAverageUserQoS(){
        for (let u = 0; u < this.data.users.length; u++) {
            let user = this.data.users[u];
            user.averageQoS = {};
            user.averageQoS[this.data.rt] = this.getUserAverageQoS(u, this.data.rt);
            user.averageQoS[this.data.tp] = this.getUserAverageQoS(u, this.data.tp);
        }
    },
    calAverageServiceQoS(){
        for (let i = 0; i < this.data.services.length; i++) {
            let service = this.data.services[i];
            service.averageQoS = {};
            service.averageQoS[this.data.rt] = this.getServiceAverageQoS(i, this.data.rt);
            service.averageQoS[this.data.tp] = this.getServiceAverageQoS(i, this.data.tp);
        }
    },
    readUserActivatedService(){
        for (let u = 0; u < this.data.users.length; u++) {
            this.data.users[u].services = {};
            this.data.users[u].services[this.data.rt] = this.getActivatedService(u, this.data.rt);
            this.data.users[u].services[this.data.tp] = this.getActivatedService(u, this.data.tp);
        }
    },
    readServiceUser(){
        for (let i = 0; i < this.data.services.length; i++) {
            this.data.services[i].users = {};
            this.data.services[i].users[this.data.rt] = this.getServiceUser(i, this.data.rt);
            this.data.services[i].users[this.data.tp] = this.getServiceUser(i, this.data.tp);
        }
    },
    initialize(density) {
        console.log('start initializing at:' + new Date().toLocaleTimeString());
        this.data.users = [];
        this.data.services = [];
        this.data.rtMatrix = [];
        this.data.tpMatrix = [];
        this.readUsers();
        this.readServices();
        this.readTPMatrix();
        this.readRTMatrix();
        this.setMatrixDensity(density);
        this.readUserActivatedService();
        this.readServiceUser();
        this.calAverageUserQoS();
        this.calAverageServiceQoS();
        console.log('data initialized at:' + new Date().toLocaleTimeString());
    },
    /**
     * 获取使用过服务s的用户
     * @param i 服务id
     * @param m rtMatrix/tpMatrix
     */
    getServiceUser(i, m){
        let arr = [];
        for (let u = 0; u < this.data.users.length; u++) {
            if (this.data[m][u][i] !== -1) {
                arr.push(this.data.users[u]);
            }
        }
        return arr;
    },
    /**
     * 获取共同使用过服务i，j的用户
     * @param i 服务id
     * @param j 服务id
     * @param m rtMatrix/tpMatrix
     */
    getBothActivatedUser(i, j, m){
        let arr = [];
        for (let u = 0; u < this.data.users.length; u++) {
            if (this.data[m][u][i] !== -1 && this.data[m][u][j] !== -1) {
                arr.push(this.data.users[u]);
            }
        }
        return arr;
    },
    /**
     * 获取用户使用过的服务
     * @param u 用户id
     * @param m rtMatrix/tpMatrix
     * @returns {Array}
     */
    getActivatedService(u, m){
        let arr = [];
        for (let i = 0; i < this.data.services.length; i++) {
            if (this.data[m][u][i] !== -1) {
                arr.push(this.data.services[i]);
            }
        }
        return arr;
    },
    /**
     * 获取两个用户都使用过的服务
     * @param u 用户id
     * @param v 用户id
     * @param m rtMatrix/tpMatrix
     * @returns {Array}
     */
    getBothActivatedService(u, v, m){
        let arr = [];
        for (let i = 0; i < this.data.services.length; i++) {
            if (this.data[m][u][i] !== -1 && this.data[m][v][i] !== -1) {
                arr.push(this.data.services[i]);
            }
        }
        return arr;
    },
    /**
     * 获取用户的平均QoS
     * @param u 用户ID
     * @param m rtMatrix/tpMatrix
     */
    getUserAverageQoS(u, m){
        let sum = 0;
        let services = this.data.users[u].services[m];
        for (let i = 0; i < services.length; i++) {
            sum += this.data[m][u][services[i].id];
        }
        return sum / services.length;
    },

    /**
     * 获取服务的平均QoS
     * @param i 服务ID
     * @param m rtMatrix/tpMatrix
     */
    getServiceAverageQoS(i, m){
        let sum = 0;
        let users = this.data.services[i].users[m];
        for (let u = 0; u < users.length; u++) {
            sum += this.data[m][users[u].id][i];
        }
        return sum / users.length;
    },
    /**
     * 获取服务的欧式距离
     * @param i 服务ID
     * @param j 服务ID
     * @returns
     */
    getServiceDistance(i, j){
        var service1 = this.data.services[i];
        var service2 = this.data.services[j];
        if (!service1.hasG || !service2.hasG)
            return this.parameters.maxDistance;
        return euclidean([service1.latitude, service1.longitude],
            [service2.latitude, service2.longitude]);
    },
    /**
     * 获取MAE
     * @param realValues
     * @param predictValues
     */
    getMAE(realValues, predictValues){
        let sum = 0
        for (let i = 0; i < predictValues.length; i++) {
            sum += Math.abs(realValues[i] - predictValues[i]);
        }
        return sum / predictValues.length;
    },
    /**
     * 获取NMAE
     * @param realValues
     * @param predictValues
     */
    getNMAE(realValues, predictValues){
        let sum = 0, sumr = 0;
        for (let i = 0; i < predictValues.length; i++) {
            sum += Math.abs(realValues[i] - predictValues[i]);
            sumr += realValues[i];
        }
        return sum / sumr;
    },
    getExperimentResult(method, m){
        let pv = [];
        let rv = [];
        for (let u = 0; u < this.data.users.length; u++) {
            let exist = false;
            for (let n = 0; n < this.data.removedArray.length; n++) {
                if (this.data.removedArray[n] === u) {
                    exist = true;
                }
            }
            if (exist) continue;
            let services = this.data.users[u].services[m];
            let len = 10;
            if (len > services.length) len = services.length;
            for (let j = 0; j < len; j++) {
                let sid = services[j].id;
                pv.push(method.getPrediction(u, sid, m));
                rv.push(this.data[m][u][sid]);
            }
        }
        console.log('mae:' + this.getMAE(rv, pv));
        console.log('nmae:' + this.getNMAE(rv, pv));
    }
};