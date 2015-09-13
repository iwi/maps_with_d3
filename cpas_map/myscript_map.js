// This is the first intent to create a UK map with D3


// Define the size of the svg
var width = 1200,
    height = 1500,
    centered,
    clicked;


// Append the svg to the body
var svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Define the colour scale
var colour = d3.scale.category10();


// Define the projection
var projection = d3.geo.albers()
    .center([5, 53.0])
    .rotate([6.5, 0])
    .parallels([50, 60])
    .scale(8000)
    .translate([width / 2, height / 2]);

// Define the path based on the projection
var path = d3.geo.path()
             .projection(projection);

// Draw the background
// plus use clicked function as suggested in: http://bl.ocks.org/mbostock/2206590
svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "grey");


// Get the GeoJSON
d3.json("ctyua_ew_generalised_WGS84.json", function(error, uk) {
 if (error) return console.error(error);

  // Get the csv with the laa to cpa data
  d3.csv("laa_cpa2.csv", function (error, laa_cpa) {
    console.log(error);
    console.log(laa_cpa);

    // Prepare the data
    combine_data(uk, laa_cpa);

    // Draw the map based on the data
    draw_map(uk);

  });
});


// Function to combine the uk and laa_cpa data
var combine_data = function(uk, laa_cpa) {
  // Merge cpa to uk - note that features are Counties and UAs which are the LAAs
  for (var feature = 0; feature < uk.features.length; feature++) {
    for (var laa = 0; laa < laa_cpa.length; laa++) {
      if (uk.features[feature].properties.CTYUA13NM == laa_cpa[laa].LAA ) {
        // Add the cpa to each county
        uk.features[feature].properties.cpa = laa_cpa[laa].CPA;
        // Add the cpa_code to each county
        uk.features[feature].properties.code = parseFloat(laa_cpa[laa].cpa_code);
        break;
      } else {
        if (laa == laa_cpa.length - 1) {
         uk.features[feature].properties.cpa = "No luck :( ";
         console.log("!!!!!!!!!!!!!!No luck with: " + uk.features[feature].properties.CTYUA13NM);
        };
      };
    };
  };
};



// Function to draw the map
var draw_map = function(geo_json) {
// the geo_json has geo_json.features[i]
// of type Feature
// each of the features has .geometry and .properties
// CTYUA13NM is the name of the countyUA

  // Check that the number of cpa is the expected
  console.log("the number of cpa is " + d3.max(geo_json.features, function(d) {
    return d.properties.code;
  }));
  console.log(geo_json);

  // Append all the paths from the data (and paint them in white)
  var counties = svg.selectAll("path")
    .data(geo_json.features)
    .enter()
    .append("path")
    .attr("d", path)  // "d" is the data
    .attr("fill", "grey");  // for the transition from nothing to colours

  // Paint the colours
  counties.transition().duration(1000)
    .attr("fill", function(d) {
      //Get data value
      var cpa_code = d.properties.code;
      if (cpa_code) {
        //If value exists…
        for (var i = 1; i < 22; i++) {
            return "rgb("
                   + cpa_code * 15
                   + ","
                   + cpa_code * 15
                   + ","
                   + cpa_code * 10
                   + ")";
        };
      } else {
        //If value is undefined…
        return "#ccc";
      };
    });


 // Add interactivity
  counties.on("click", function(d) {

    var clicked_cpa = d.properties.code;

    counties.transition().duration(1000)
      .attr("fill", function(data) {
        //Get data value
        var cpa_code = data.properties.code;
        if (cpa_code) {
          //If value exists…
          for (var i = 1; i < 22; i++) {
            if (cpa_code != clicked_cpa) {
              return "rgb("
                   + cpa_code * 15
                   + ","
                   + cpa_code * 15
                   + ","
                   + cpa_code * 10
                   + ")";
            } else {
              return "orange";
            };
          };
        } else {
          //If value is undefined…
          return "#ccc";
        };
      });

       // Append text to the svg - CTYUA13NM which is the name of the LAA
       svg.append("text")
          .attr("id", "tooltip")
          .attr( {
            x: 10,
            y: 70,
            "font-family": "sans-serif",
            "font-size": "30px",
            //"font-weight": "bold",
            fill: "lack"
          })
          .text(d.properties.CTYUA13NM)

       // Append text to the svg - the name of the cpa
       svg.append("text")
          .attr("id", "tooltip2")
          .attr( {
            x: 15,
            y: 130,
            "font-family": "sans-serif",
            "font-size": "30px",
            "font-weight": "bold",
            fill: "orange"
          })
          .text(d.properties.cpa);

       // Append text to the svg - the number of the cpa
       svg.append("text")
          .attr("id", "tooltip3")
          .attr( {
            x: 10,
            y: 190,
            "font-family": "sans-serif",
            "font-size": "30px",
            "font-weight": "bold",
            fill: "orange"
          })
          .text("CPA " + d.properties.code);


       console.log(d.properties.CTYUA13NM);
       console.log(d.properties.cpa);
     })


     // Remove the effects added with the click
     .on("mouseout", function(d) {
       d3.select("#tooltip").remove();
       d3.select("#tooltip2").remove();
       d3.select("#tooltip3").remove();
       counties.attr("fill", function(d) {
           //Get data value
           var cpa_code = d.properties.code;
           // return to the original colours
            return "rgb("
                   + cpa_code * 15
                   + ","
                   + cpa_code * 15
                   + ","
                   + cpa_code * 10
                   + ")";
     });
     });
};

