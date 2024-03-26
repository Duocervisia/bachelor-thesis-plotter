loadData = function(url) {
    let request = new XMLHttpRequest();
    request.open("GET", url, false);
    let data;

    // Define the behavior when the request is completed.
    request.onload = function () {
        if (this.status >= 200 && this.status < 400) {
            // Parse the JSON response.
            data = JSON.parse(this.response);
        }
    }
    request.send();
    return data;
}

// let data = loadData("data.json");
let ch = loadData("weather.json");
let euler = new Euler();
let resultsEuler = euler.run(ch);
let beyer = new Beyer();
let resultsBeyer = beyer.run(ch);
let beyerNew = new BeyerNew();
let resultsBeyerNew = beyerNew.run(ch);
ch = loadData("weather1min.json");
let eulerOneMin = new EulerOneMin();
let resultsEulerOneMin = eulerOneMin.run(ch);


let newData = [];
let beginnTime = 1504173600;
let endTime = 1504188000;
// let beginnTime = 1501480800;
// let endTime = 1501509600;
resultsEulerOneMin.forEach((d) => {
    if(d[0] <= endTime && d[0] >= beginnTime) {
        newData.push({
            date: new Date(d[0] * 1000),
            moduleTemperatureEulerOneMin: d[2],
            temperature: d[1]
        });
    }
});
resultsEuler.forEach((d) => {
    if(d[0] <= endTime && d[0] >= beginnTime) {
        //find the corresponding data point in newData, where the date is the same
        let index = newData.findIndex((element) => {
            return element.date.getTime() === d[0] * 1000;
        });

        if(index !== -1) {
            newData[index].moduleTemperatureEulerFiveMin = d[1];
        }
    }
});
resultsBeyer.forEach((d) => {
    if(d[0] <= endTime && d[0] >= beginnTime) {
        //find the corresponding data point in newData, where the date is the same
        let index = newData.findIndex((element) => {
            return element.date.getTime() === d[0] * 1000;
        });

        if(index !== -1) {
            newData[index].moduleTemperatureBeyerFiveMin = d[1];
        }
    }
});
resultsBeyerNew.forEach((d) => {
    if(d[0] <= endTime && d[0] >= beginnTime) {
        //find the corresponding data point in newData, where the date is the same
        let index = newData.findIndex((element) => {
            return element.date.getTime() === d[0] * 1000;
        });

        if(index !== -1) {
            newData[index].moduleTemperatureBeyerNewFiveMin = d[1];
        }
    }
});
let totalDiffEuler = 0;
let totalDiffBeyer = 0;
let totalDiffBeyerNew = 0;

newData.forEach((d) => {
    if(d.moduleTemperatureEulerFiveMin === undefined) {
        return;
    }
    totalDiffEuler += Math.abs(d.moduleTemperatureEulerOneMin - d.moduleTemperatureEulerFiveMin);
    totalDiffBeyer += Math.abs(d.moduleTemperatureEulerOneMin - d.moduleTemperatureBeyerFiveMin);
    totalDiffBeyerNew += Math.abs(d.moduleTemperatureEulerOneMin - d.moduleTemperatureBeyerNewFiveMin);
});
console.log("Total difference Euler: " + totalDiffEuler);
console.log("Total difference Beyer: " + totalDiffBeyer);
console.log("Total difference Beyer New: " + totalDiffBeyerNew);
let legendDiv = document.getElementById("legend");
let span = document.createElement("span");
span.textContent = totalDiffEuler.toFixed(2) + " Euler Abweichung";
legendDiv.appendChild(span);
span = document.createElement("span");
span.textContent = totalDiffBeyer.toFixed(2) + " Beyer Abweichung";
legendDiv.appendChild(span);
span = document.createElement("span");
span.textContent = totalDiffBeyerNew.toFixed(2) + " Beyer New Abweichung";
legendDiv.appendChild(span);

const myChart = new Chart(document.getElementById("myChart"), {
    type: "line",
    data: {
        labels: newData.map((d) => {
            let date = d.date;
            let hours = date.getHours();
            let minutes = date.getMinutes();
        
            // Pad the minutes with a 0 if it's less than 10
            minutes = minutes < 10 ? '0' + minutes : minutes;
        
            return hours + ':' + minutes;
        }),
        datasets: [
            {
                label: "Temperature",
                data: newData.map((d) => d.temperature),
                borderColor: "red",
                fill: false,
            },
            {
                label: "Module Temperature Euler 5 min",
                data: newData.map((d) => d.moduleTemperatureEulerFiveMin),
                borderColor: "green",
                fill: false,
                showLine: true, // This will show the line
            },
            {
                label: "Module Temperature Beyer 5 Min",
                data: newData.map((d) => d.moduleTemperatureBeyerFiveMin),
                borderColor: "purple",
                fill: false,
                showLine: true, // This will show the line
            },
            {
                label: "Module Temperature Beyer New 5 Min",
                data: newData.map((d) => d.moduleTemperatureBeyerNewFiveMin),
                borderColor: "red",
                fill: false,
                showLine: true, // This will show the line
            },
            {
                label: "Module Temperature Euler 1 Min",
                data: newData.map((d) => d.moduleTemperatureEulerOneMin),
                borderColor: "blue",
                fill: false,
            },
        ],
    }
});
// const myChart = new Chart(document.getElementById("myChart"), {
//     type: "line",
//     data: {
//         labels: data.map((d) => d.date),
//         datasets: [
//             {
//                 label: "Temperature",
//                 data: data.map((d) => d.temperature),
//                 borderColor: "red",
//                 fill: false,
//             },
//             {
//                 label: "Humidity",
//                 data: data.map((d) => d.humidity),
//                 borderColor: "blue",
//                 fill: false,
//             },
//         ],
//     }
// });

