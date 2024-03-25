// The JsonLoader class handles the loading of JSON files for different components.
class JsonLoader {
    // Declare an instance variable for the Initializer.
    bridge;

    // Declare variables for JSON data related to different components.
    phh;
    ppv;
    ppvS30;
    pev;
    ea_chargingInfo;

    // Track the number of JSON files loaded and define JSON files to preload.
    jsonLoaded = 0;
    jsonToPreLoad = {
        "phh" : "./data/phh.json",
        "weather" : "./data/weather.json",
        // "weather" : "./data/weather1min.json",
        "ppvS15" : "./data/ppvS15.json",
        "ppvS30" : "./data/ppvS30.json",
        "ppvS45" : "./data/ppvS45.json",
        "ppvO15" : "./data/ppvO15.json",
        "ppvO30" : "./data/ppvO30.json",
        "ppvO45" : "./data/ppvO45.json",
        "ppvN15" : "./data/ppvN15.json",
        "ppvN30" : "./data/ppvN30.json",
        "ppvN45" : "./data/ppvN45.json",
        "ppvW15" : "./data/ppvW15.json",
        "ppvW30" : "./data/ppvW30.json",
        "ppvW45" : "./data/ppvW45.json",
    };

    // Define JSON files to load on value change for specific components.
    jsonToLoadOnValueChange = {
        'ev' : {
            "ea_chargingInfo" : "./data/pev-info.json"
        },
        'wp' : {
            "pwp" : "./data/pwp.json",
            "qheat_old" : "./data/qheat_old.json",
            "qheat_passive" : "./data/qheat_passive.json",
            "qtww_old" : "./data/qtww_old.json",
            "qtww_passive" : "./data/qtww_passive.json",
            "Ta" : "./data/Ta.json",
        }
    };

    // Constructor that takes an Initializer instance as a parameter.
    constructor(bridge) {
        this.bridge = bridge;

        // Preload JSON files.
        for (let key in this.jsonToPreLoad) {
            this.httpJsonRequest(this.jsonToPreLoad[key], key, true);
        }
    }

    // Load JSON files on value change for a specific component.
    loadJsonOnValuenChange(name) {
        let obj = this.jsonToLoadOnValueChange[name];
        this.jsonLoaded = 0;

        // Loop through the JSON files and load them.
        for (let key in obj) {
            if (eval("this." + key) === undefined) {
                this.httpJsonRequest(obj[key], key, true, true, name);
            } else {
                return false;
            }
        }
        return true;
    }

    // Make an HTTP request to load a JSON file.
    httpJsonRequest(url, variableName, init = false, async = true, valueChangeName) {
        let that = this;
        let request = new XMLHttpRequest();
        request.open("GET", url, async);

        // Define the behavior when the request is completed.
        request.onload = function () {
            if (this.status >= 200 && this.status < 400) {
                // Success! Parse the JSON response and update the corresponding variable.
                eval("that." + variableName + " = JSON.parse(this.response)");

                if (init) {
                    that.jsonLoaded++;

                    // Trigger calculations or simulations based on the component and value change.
                    switch (valueChangeName) {
                        case "wp":
                            if (that.jsonLoaded === Object.keys(that.jsonToLoadOnValueChange[valueChangeName]).length) {
                                that.bridge.calculationHandler.heatPump.calcHeatPump();
                            }
                            break;
                        case "ev":
                            if (that.jsonLoaded === Object.keys(that.jsonToLoadOnValueChange[valueChangeName]).length) {
                                that.bridge.simulation.calcSimulation(false);
                            }
                            break;
                        default:
                            if (that.jsonLoaded === Object.keys(that.jsonToPreLoad).length) {
                                that.bridge.simulation.calcSimulation(false);
                            }
                            break;
                    }
                }
            } else {
                // Error handling for HTTP response status indicating an error.
                console.log("Error1 " + variableName);
            }
        };

        // Error handling for connection errors.
        request.onerror = function () {
            console.log("Error2 " + variableName);
        };

        // Send the HTTP request.
        request.send();
    }
}
