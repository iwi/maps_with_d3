// This is the first intent to create a UK map with D3


// Define the size of the svg
var width = 1200,
    height = 1500,
    centered,
    clicked;


// Append the svg to the body
var svg = d3
  .select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

// Define the colour scale
var colour = d3.scale.category10();


// Define the projection
var projection = d3
  .geo.albers()
  .center([5, 53.0])
  .rotate([6.5, 0])
  .parallels([50, 60])
  .scale(8000)
  .translate([width / 2, height / 2]);

// Define the path based on the projection
var path = d3
  .geo.path()
  .projection(projection);

// Draw the background
// plus use clicked function as suggested in: http://bl.ocks.org/mbostock/2206590
svg
  .append("rect")
  .attr("width", width)
  .attr("height", height)
  .attr("fill", "grey");


// Get the GeoJSON
d3.json("ctyua_ew_generalised_WGS84.json", function (error, uk) {
  if (error) return console.error(error);

  // Get the csv with the laa to cpa data
  d3.csv("laa_cpa2.csv", function (error, laa_cpa) {
    if (error) return console.log(error);

    // Prepare the data
    var features = combine_data(uk.features, laa_cpa);

    // Draw the map based on the data
    draw_map(features);
  });
});


/**
 * Receives a collection and a predicate and gets the first filtered result.
 */
function find(collection, predicate) {
  return collection.filter(predicate)[0];
}

function has_laa(feature, laa) {
  return (laa.LAA === feature.properties.CTYUA13NM);
};


/**
  * Merge CPA to UK features (countries and UAs which are the LAAs.)
  */
function combine_data(features, laa_cpa) {
  return features.map(function (feature) {
    var laa = find(laa_cpa, has_laa.bind(this, feature));

    if (laa === undefined) {
      feature.properties.cpa = "No luck :(";
      console.log("!!!!!!!!!!!!!!No luck with: " + feature.properties.CTYUA13NM);
    } else {
      feature.properties.cpa = laa.CPA;
      feature.properties.code = parseFloat(laa.cpa_code, 10);
    };

    return feature;
  });
};


/**
 * Returns a RGB color from a number.
 *
 * @param {number}
 * @return {string} A CSS rgb function.
 */
function rgb(n) {
  return "rgb("
         + n * 15
         + ","
         + n * 15
         + ","
         + n * 10
         + ")";
};

/**
 * Receives a collection of strings and puts them in sequence.
 */
function show_tooltips(collection) {
  collection.map(function (string, index) {
    return svg.append("text")
      .attr("id", "tooltip" + index)
      .attr({
        x: 10,
        y: (60 + (index * 40)),
        "font-family": "sans-serif",
        "font-size": "30px",
        fill: "lack"
      })
      .text(string);
  });
};

/**
 * Function to draw the map.
 *
 * @param {Object[]} features - The geo_json features.
 * @param {Object} features[].geometry - Contains coordinates[].
 * @param {Object} features[].properties - CTYUA13NM is the name of the countyUA.
 */
function draw_map(features) {
  var total_cpa = d3.max(features, function (d) { return d.properties.code });
  // Check that the number of cpa is the expected
  console.log("the number of cpa is " + total_cpa);

  // Append all the paths from the data (and paint them in white)
  var counties = svg.selectAll("path")
    .data(features)
    .enter()
    .append("path")
    .attr("d", path)  // "d" is the data
    .attr("fill", "grey");  // for the transition from nothing to colours

  // Paint the colours
  counties.transition().duration(1000)
    .attr("fill", function (d) {
      var cpa_code = d.properties.code;

      if (cpa_code === undefined) { return '#ccc' };

      // If value exists…
      return rgb(cpa_code);
    });


 // Add interactivity
  counties.on("click", function (d) {
    var clicked_cpa = d.properties.code;

    counties.transition().duration(1000)
      .attr("fill", function (data) {
        var cpa_code = data.properties.code;

        if (cpa_code === undefined) { return '#ccc' };
        if (cpa_code === clicked_cpa) { return 'orange' };

        return rgb(cpa_code);
      });

      // Append text to the svg - CTYUA13NM which is the name of the LAA
      show_tooltips([d.properties.CTYUA13NM, d.properties.cpa, d.properties.code]);
  });

  // Remove the effects added with the click
  counties.on("mouseout", function (d) {
    d3.select("#tooltip0").remove();
    d3.select("#tooltip1").remove();
    d3.select("#tooltip2").remove();

    // return to the original colours
    counties.attr("fill", function (d) { return rgb(d.properties.code) });
  });
};
