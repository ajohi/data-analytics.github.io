var margin = {top: 20, right: 30, bottom: 20, left: 200},
    width = 960 - margin.left - margin.right,
    height = 420 - margin.top - margin.bottom;

var stations = []; // lazily loaded

var formatTime = d3.time.format("%I:%M%p");

var x = d3.time.scale()
    .domain([parseTime("5:30AM"), parseTime("10:45PM")])
    .range([0, width]);

var y = d3.scale.linear()
    .range([0, height]);

var z = d3.scale.linear()
    .domain([0.00001, 0.00003])
    .range(["purple", "orange"])
    .interpolate(d3.interpolateLab);

var xAxis = d3.svg.axis()
    .scale(x)
    .ticks(10);
    

var svg = d3.select(".trains").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("xmlns", 'http://www.w3.org/2000/svg')
    .attr("xlink", 'http://www.w3.org/1999/xlink')
    .attr("version", '1.1')
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg.append("defs").append("clipPath")
    .attr("id", "clip")
  .append("rect")
    .attr("y", -margin.top)
    .attr("width", width)
    .attr("height", height + margin.top + margin.bottom);

d3.csv("data.csv", type, function(error, trains) {
  y.domain(d3.extent(stations, function(d) { return d.distance; }));

  var station = svg.append("g")
      .attr("class", "station")
    .selectAll("g")
      .data(stations)
    .enter().append("g")
      .attr("transform", function(d) { return "translate(0," + y(d.distance) + ")"; });

  station.append("text")
      .attr("x", -6)
      .attr("dy", ".35em")
      .text(function(d) { return d.name; });

  station.append("line")
      .attr("x2", width)
      .style("stroke",'#555');

  svg.append("g")
      .attr("class", "x top axis")
      .call(xAxis.orient("top"));

  svg.append("g")
      .attr("class", "x bottom axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis.orient("bottom"));

  var train = svg.append("g")
      .attr("class", "train")
      .attr("clip-path", "url(#clip)")
    .selectAll("g")
      .data(trains.filter(function(d) { return /[NLB]/.test(d.type); }))
    .enter().append("g")
      .attr("class", function(d) { return d.type; });

  train.selectAll("line")
      .data(function(d) { return d.stops.slice(1).map(function(b, i) { return [d.stops[i], b]; }); })
    .enter().append("line")

      .attr("x1", function(d) { return x(d[0].time); })
      .attr("x2", function(d) { return x(d[1].time); })
      .attr("y1", function(d) { return y(d[0].station.distance); })
      .attr("y2", function(d) { return y(d[1].station.distance); })
      .style("stroke", function(d) { return z(Math.abs((d[1].station.distance - d[0].station.distance) / (d[1].time - d[0].time))); });

  var circle = train.selectAll("circle")
      .data(function(d) { return d.stops; })
    .enter().append("a")
        .attr("xlink:href",function(d) { return 'https://www.google.co.in/search?q='+d.station.name } )
        .attr("target","_blank").append("circle")
      .attr("transform", function(d) { return "translate(" + x(d.time) + "," + y(d.station.distance) + ")"; })
      .attr("r", 3)
      .attr("data-title",function(d) { 
        var dd = "AM";
        var hours = d.time.getHours();
    if (hours > 12) {
        hours = d.time.getHours()-12;
        dd = "PM";    
    }
    if (hours == 12){
    dd = "PM";
    }
    
        return  d.station.name+' -'+hours+':'+d.time.getMinutes()+' '+dd ; });
        
     $("circle").tooltip({container: 'body', html: true, placement:'top'});
         
      });

function type(d, i) {

  // Extract the stations from the "stop|*" columns.
  if (!i) for (var k in d) {
    if (/^stop\|/.test(k)) {
      var p = k.split("|");
      stations.push({
        key: k,
        name: p[1],
        distance: +p[2],
        zone: +p[3]
      });
    }
  }

  return {
    number: d.number,
    type: d.type,
    direction: d.direction,
    stops: stations
        .map(function(s) { return {station: s, time: parseTime(d[s.key])}; })
        .filter(function(s) { return s.time != null; })
  };
}

function parseTime(s) {
  var t = formatTime.parse(s);
  if (t != null && t.getHours() < 1) t.setDate(t.getDate() + 1);
  return t;
}