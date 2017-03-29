/**
 * Created by ck on 23/03/2017.
 */
module.exports = class {
    constructor(id, ip, country, as, latitude, longitute) {
        this.id = Number(id);
        this.ip = ip;
        this.country = country;
        this.as = as;
        this.hasG = true;
        if (!latitude || latitude === 'null' || !longitute || longitute === 'null') {
            this.hasG = false;
        }
        this.latitude = Number(latitude);
        this.longitude = Number(longitute);
    }
};