const fetch = require("node-fetch");
const { DateTime } = require("luxon");

module.exports = class AsyncWeather {
    constructor() {
        this.appID = "";
        this.host = "https://api.openweathermap.org/data/2.5/";

        this.coordinates = {};
        this.location = "";

        this.mode = "json";
        this.units = "metric";
        this.lang = "en";
    }

    setAppID(appID) {
        this.appID = appID;
    }

    getAppID() {
        return this.appID;
    }

    /**
     * 
     * @param {*} location 
     * @returns Promise
     */
    async setLocation(location) {
        const p = new Promise(async (resolve, reject) => {
            this.location = String(location).toLowerCase();
            const params = new URLSearchParams({
                q: this.location,
                appid: this.appID,
                mode: this.mode,
                units: this.units,
                lang: this.lang,
            });

            await fetch.default(this.host + "weather?" + params)
                .then(data => data.json())
                .then(data => {
                    resolve(this.coordinates = data.coord);
                }).catch(err => reject(new Error(err)));
        });

        return p;
    }

    /**
     * 
     * @returns {String} Returns location
     */
    getLocation() {
        return this.location;
    }

    async getCurrentWeather() {
        const p = new Promise(async (resolve, reject) => {
            const params = new URLSearchParams({
                q: this.location,
                appid: this.appID,
                mode: this.mode,
                units: this.units,
                lang: this.lang,
            });

            await fetch.default(this.host + "weather?" + params)
                .then(data => data.json())
                .then(resolve)
                .catch(err => reject(new Error(err)));
        });

        return p;
    }

    async getWeatherForecast(include = []) {
        const p = new Promise(async (resolve, reject) => {
            let exclude = ["current", "minutely", "hourly", "daily", "alerts"];
            include.forEach(i => {
                exclude = exclude.filter(item => item !== i);
            });

            const params = new URLSearchParams({
                lat: this.coordinates.lat,
                lon: this.coordinates.lon,
                exclude: exclude.join(","),
                appid: this.appID,
                mode: this.mode,
                units: this.units,
                lang: this.lang,
            });

            await fetch.default(this.host + "onecall?" + params)
                .then(data => data.json())
                .then(data => {
                    if (data.current) {
                        data.current.dt = DateTime.fromSeconds(data.current.dt, { zone: data.timezone }).toFormat("T");
                        data.current.sunrise = DateTime.fromSeconds(data.current.sunrise, { zone: data.timezone }).toFormat("T");
                        data.current.sunset = DateTime.fromSeconds(data.current.sunset, { zone: data.timezone }).toFormat("T");

                    }
                    if (data.minutely) {
                        data.minutely.forEach(minute => {
                            minute.dt = DateTime.fromSeconds(minute.dt, { zone: data.timezone }).toFormat("T");
                        });
                    }
                    if (data.hourly) {
                        data.hourly.forEach(hour => {
                            hour.dt = DateTime.fromSeconds(hour.dt, { zone: data.timezone }).toFormat("T");
                        });
                    }
                    if (data.daily) {
                        data.daily.forEach(day => {
                            day.dt = DateTime.fromSeconds(day.dt, { zone: data.timezone }).toFormat("DDDD");
                            day.sunrise = DateTime.fromSeconds(day.sunrise, { zone: data.timezone }).toFormat("T");
                            day.sunset = DateTime.fromSeconds(day.sunset, { zone: data.timezone }).toFormat("T");
                            day.moonrise = DateTime.fromSeconds(day.moonrise, { zone: data.timezone }).toFormat("T");
                            day.moonset = DateTime.fromSeconds(day.moonset, { zone: data.timezone }).toFormat("T");
                        });
                    }
                    if (data.alerts) {
                        data.alerts.forEach(alert => {
                            alert.start = DateTime.fromSeconds(alert.start, { zone: data.timezone }).toFormat("DDDD");
                            alert.end = DateTime.fromSeconds(alert.end, { zone: data.timezone }).toFormat("DDDD");
                        });
                    }
                    resolve(data);
                })
                .catch(err => reject(new Error(err)));
        });

        return p;
    }

};