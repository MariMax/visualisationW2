
var maxWidth = document.querySelector('body');
var maxHeight = document.querySelector('body');

var margin = {top:0, right: 80, bottom: 30, left: 50},
    width = maxWidth.clientWidth - margin.left - margin.right,
    height = maxHeight.clientHeight / 2 - margin.top - margin.bottom,

    bisectDate = d3.bisector(function(d) { return d.Year; }).left;

var format = d3.time.format('%Y');
var x = d3.time.scale()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height, 0]);

var color = d3.scale.category10();

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .tickFormat(format);

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

var line = d3.svg.line()
    .interpolate("basis")
    .x(function (d) {
        return x(d.date);
    })
    .y(function (d) {
        return y(d.temperature);
    });

var svg = d3.select("#graph").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Tooltip
var focus = svg.append("g")
    .style("display", "none");

d3.json("years.json", function (error, data) {
    if (error) throw error;

    data.forEach(function(i){
        i.Year = new Date(i.Year, 0, 0, 0, 0);
    });

    color.domain(d3.keys(data[0]).filter(function (key) {
        return key !== "Year";
    }));

    var cities = color.domain().map(function (name) {
        return {
            name: name,
            values: data.map(function (d) {
                return {date: d.Year, temperature: d[name]};
            })
        };
    });

    x.domain(d3.extent(data, function (d) {
        return d.Year;
    }));

    y.domain([
        d3.min(cities, function (c) {
            return d3.min(c.values, function (v) {
                return v.temperature;
            });
        }),
        d3.max(cities, function (c) {
            return d3.max(c.values, function (v) {
                return v.temperature;
            });
        })
    ]);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Temperature (ºF)");

    var city = svg.selectAll(".city")
        .data(cities)
        .enter().append("g")
        .attr("class", "city");

    city.append("path")
        .attr("class", "line")
        .attr("d", function (d) {
            return line(d.values);
        })
        .style("stroke", function (d) {
            return color(d.name);
        });

    // city.append("text")
    //     .datum(function (d) {
    //         return {name: d.name, value: d.values[d.values.length - 1]};
    //     })
    //     .attr("transform", function (d) {
    //         return "translate(" + x(d.value.date) + "," + y(d.value.temperature) + ")";
    //     })
    //     .attr("x", 3)
    //     .attr("dy", ".05em")
    //     .text(function (d) {
    //         return d.name;
    //     });


    // append the y tooltip
    focus.append("line")
        .attr("class", "y-tip")
        .attr("y1", 0)
        .attr("y2", height);

    // append the rectangle to capture mouse
    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", function() { focus.style("display", null); })
        .on("mouseout", function() { focus.style("display", "none"); var table = document.querySelector('#data'); table.innerHTML = '';})
        .on("mousemove", mousemove);

    function mousemove() {

        var x0 = x.invert(d3.mouse(this)[0]),
            i = bisectDate(data, x0, 1),
            d0 = data[i - 1],
            d1 = data[i],
            d = x0 - d0.Year > d1.Year - x0 ? d1 : d0;


        focus.select(".y-tip")
            .attr("transform",
                "translate(" + x(d.Year) + ",0)");

        var table = document.querySelector('#data');
        var html = '<div><div>Year</div><div>'+d1.Year.getFullYear()+'</div></div>';
        Object.keys(d1).forEach(function(i){
            if (i==='Year') return;
            html+='<div><div>'+i+'</div><div>'+d0[i]+'</div></div>';
        });
        table.innerHTML = html;

    }
});