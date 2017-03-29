/**s
 * Created by ck on 23/03/2017.
 */
const core = require('./core').core;
const UPCC = require('./upcc');
const IPCC = require('./ipcc');
const ILT = require('./ilt');
function main() {

    core.initialize(0.1);
    // let upcc = new UPCC(2);
    // let ipcc = new IPCC(3);
    // let ilt = new ILT(2, 1);


    // console.log(ilt.getSim(0, 0, core.data.rt));
    // console.log(ilt.getSim(0, 0, core.data.tp));
    // return;
    // console.log(upcc.getPrediction(0, 0, 'rtMatrix'));
    // console.log(upcc.getPrediction(0, 0, 'tpMatrix'));
    // console.log(core.data.rtMatrix[0][0] + ',' + core.data.tpMatrix[0][0]);


    // //
    // core.getExperimentResult(upcc, core.data.rt);
    // core.getExperimentResult(ipcc, core.data.rt);
    // core.getExperimentResult(ilt, core.data.rt);


    // core.getExperimentResult(upcc, core.data.tp);
    // core.getExperimentResult(ipcc, core.data.tp);
    // core.getExperimentResult(ilt, core.data.tp);

    for (let k = 1; k <= 7; k++) {
        let ilt = new ILT(k * 5, 3, 0.1);
        core.getExperimentResult(ilt, core.data.tp);
    }

    console.log('finished at:' + new Date().toLocaleTimeString());
}
main();