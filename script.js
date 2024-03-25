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
ch = loadData("weather1min.json");
let eulerOneMin = new EulerOneMin();
let resultsEulerOneMin = eulerOneMin.run(ch);

let newData = [];
resultsEulerOneMin.forEach((d) => {
    if(d[0] <= 1504188000 && d[0] >= 1504173600) {
        newData.push({
            date: new Date(d[0] * 1000),
            moduleTemperatureEulerOneMin: d[2],
            temperature: d[1]
        });
    }
});
resultsEuler.forEach((d) => {
    if(d[0] <= 1504188000 && d[0] >= 1504173600) {
        //find the corresponding data point in newData, where the date is the same
        let index = newData.findIndex((element) => {
            return element.date.getTime() === d[0] * 1000;
        });

        if(index !== -1) {
            newData[index].moduleTemperatureEulerFiveMin = d[1];
        }
    }
});
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
                label: "Module Temperature Euler",
                data: newData.map((d) => d.moduleTemperatureEulerFiveMin),
                borderColor: "green",
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

