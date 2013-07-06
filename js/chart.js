﻿"use strict";

var _TEXT_SIZE_SHIM_ID = "sb-text-size-shim";
var _TEXT_SIZE_SHIM_ID_SELECTOR = "#" + _TEXT_SIZE_SHIM_ID;

var _CHART_SVG_ID = "chart";
var _CHART_SVG_ID_SELECTOR = "#" + _CHART_SVG_ID;

var margin = { top: 20, right: 20, bottom: 30, left: 50 };

var legendLineWidth = 10;

var colours = [
    "red", "blue", "green", "black", "#CC0066", "#000099", "#FFCC00", "#996600",
    "#9900FF", "#CCCC00", "#FFFF66",  "#CC6699", "#99FF33", "#3399FF",
    "#CC33CC", "#33FFFF", "#FF00FF"
];

var backgroundColour1 = '#EEEEEE';
var backgroundColour2 = '#DDDDDD';

/**
* A chart object in a window.
* @constructor
* @param {HTMLElement} parent - The parent object to create the element within.
*/
SplitsBrowser.Controls.Chart = function (parent) {
    this.parent = parent;

    this.xScale = null;
    this.yScale = null;
    this.yScaleMinutes = null;
    this.overallWidth = -1;
    this.overallHeight = -1;
    this.contentWidth = -1;
    this.contentHeight = -1;
    this.numControls = -1;
    this.selectedIndexes = [];
    this.names = [];
    this.cumTimes = [];
    
    this.isMouseIn = false;
    
    // The position the mouse cursor is currently over, or null for not over
    // the charts.
    this.currentControlIndex = null;
    
    this.controlLine = null;

    this.svg = d3.select(this.parent).append("svg")
                                     .attr("id", _CHART_SVG_ID);
    this.svgGroup = this.svg.append("g")
                            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                                     
    var outerThis = this;
    $(this.svg.node()).mouseenter(function(event) { outerThis.onMouseEnter(event); })
                      .mousemove(function(event) { outerThis.onMouseMove(event); })
                      .mouseleave(function(event) { outerThis.onMouseLeave(event); });

    // Add an invisible text element used for determining text size.
    this.svg.append("text").attr("fill", "transparent").attr("id", _TEXT_SIZE_SHIM_ID);
};

/**
* Handle the mouse entering the chart.
*/
SplitsBrowser.Controls.Chart.prototype.onMouseEnter = function() {
    this.isMouseIn = true;
};

/**
* Handle a mouse movement.
* @param {EventObject} event - The event object.
*/
SplitsBrowser.Controls.Chart.prototype.onMouseMove = function(event) {
    if (this.isMouseIn && this.xScale != null) {
        var svgNodeAsJQuery = $(this.svg.node());
        var offset = svgNodeAsJQuery.offset();
        var xOffset = event.pageX - offset.left;
        var yOffset = event.pageY - offset.top;
        
        if (   margin.left <= xOffset && xOffset < svgNodeAsJQuery.width() - margin.right 
            && margin.top <= yOffset && yOffset < svgNodeAsJQuery.height() - margin.bottom) {
            // In the chart.
            // Get the time offset that the mouse is currently over.
            var chartX = this.xScale.invert(xOffset - margin.left);
            var bisectIndex = d3.bisect(this.cumTimes, chartX);
            
            // bisectIndex is the index at which to insert chartX into cumTimes
            // in order to keep the array sorted.  So if this index is N, the
            // mouse is between N - 1 and N.  Find which is nearer.
            var controlIndex;
            if (bisectIndex >= this.cumTimes.length) {
                // Off the right-hand end, use the finish.
                controlIndex = this.numControls + 1;
            } else {
                var diffToNext = Math.abs(this.cumTimes[bisectIndex] - chartX);
                var diffToPrev = Math.abs(chartX - this.cumTimes[bisectIndex - 1]);
                controlIndex = (diffToPrev < diffToNext) ? bisectIndex - 1 : bisectIndex;
            }
            
            if (this.currentControlIndex === null || this.currentControlIndex != controlIndex) {
                // The control line has appeared for ths first time or has moved, so redraw it.
                this.removeControlLine();
                this.drawControlLine(controlIndex);
            }
        } else {
            // In the SVG element but outside the chart area.
            this.removeControlLine();
        }
    }
};

/**
* Handle the mouse leaving the chart.
*/
SplitsBrowser.Controls.Chart.prototype.onMouseLeave = function() {
    this.isMouseIn = false;
    this.removeControlLine();
};

/**
* Draw a 'control line'.  This is a vertical line running the entire height of
* the chart, at one of the controls.
* @param {Number} controlIndex - The index of the control at which to draw the
*                                control line.
*/
SplitsBrowser.Controls.Chart.prototype.drawControlLine = function(controlIndex) {
    this.currentControlIndex = controlIndex;
    var xPosn = this.xScale(this.cumTimes[controlIndex]);
    this.controlLine = this.svgGroup.append("line")
                                    .attr("x1", xPosn)
                                    .attr("y1", 0)
                                    .attr("x2", xPosn)
                                    .attr("y2", this.contentHeight)
                                    .attr("class", "controlLine")
                                    .node();
};

/**
* Remove any previously-drawn control line.  If no such line existed, nothing
* happens.
*/
SplitsBrowser.Controls.Chart.prototype.removeControlLine = function() {
    this.currentControlIndex = null;
    if (this.controlLine != null) {
        d3.select(this.controlLine).remove();
        this.controlLine = null;
    }
};

/**
* Returns a tick-formatting function that formats the label of a tick on the
* top X-axis.
*
* The function returned is suitable for use with the D3 axis.tickFormat method.
* This label is "S" for index 0 (the start), "F" for the finish, and
* the control number for intermediate controls.
*
* @returns {function} Tick-formatting function.
*/
SplitsBrowser.Controls.Chart.prototype.getTickFormatter = function () {
    var outerThis = this;
    return function (value, idx) {
        return (idx == 0) ? "S" : ((idx == outerThis.numControls + 1) ? "F" : idx.toString());
    };
}

/**
* Get the width of a piece of text.
* @param {string} text - The piece of text to measure the width of.
* @returns {Number} The width of the piece of text, in pixels. 
*/
SplitsBrowser.Controls.Chart.prototype.getTextWidth = function (text) {
    return d3.select(_TEXT_SIZE_SHIM_ID_SELECTOR).text(text).node().getBBox().width;
};

/**
* Gets the height of a piece of text.
*
* @param {string} text - The piece of text to measure the height of.
* @returns {Number} The height of the piece of text, in pixels.
*/
SplitsBrowser.Controls.Chart.prototype.getTextHeight = function (text) {
    return d3.select(_TEXT_SIZE_SHIM_ID_SELECTOR).text(text).node().getBBox().height;
};

/**
* Return the maximum width of the end-text shown to the right of the graph.
*
* This function considers only the competitors whose indexes are in the
* list given.  This method returns zero if the list is empty.
* @returns {Number} Maximum width of text, in pixels.
*/
SplitsBrowser.Controls.Chart.prototype.getMaxGraphEndTextWidth = function () {
    if (this.selectedIndexes.length == 0 || this.names.length == 0) {
        // No competitors selected or no names yet.  Avoid problems caused
        // by trying to find the maximum of an empty array.
        return 0;
    } else {
        var outerThis = this;
        var widths = this.names.map(function (name) { return outerThis.getTextWidth(name); });
        return d3.max(widths);
    }
};

/**
* Creates the X and Y scales necessary for the chart and its axes.
* @param {object} chartData - Chart data object.
*/
SplitsBrowser.Controls.Chart.prototype.createScales = function (chartData) {
    this.xScale = d3.scale.linear().domain(chartData.xExtent).range([0, this.contentWidth]);
    this.yScale = d3.scale.linear().domain(chartData.yExtent).range([0, this.contentHeight]);
    this.yScaleMinutes = d3.scale.linear().domain([chartData.yExtent[0] / 60, chartData.yExtent[1] / 60]).range([0, this.contentHeight]);
};

/**
* Draw the background rectangles that indicate sections of the course
* between controls.
*/
SplitsBrowser.Controls.Chart.prototype.drawBackgroundRectangles = function () {
    var rects = this.svgGroup.selectAll("rect")
                             .data(d3.range(this.numControls + 1))

    var outerThis = this;

    rects.enter().append("rect");

    rects.attr("x", function (index) { return outerThis.xScale(outerThis.cumTimes[index]); })
            .attr("y", 0)
            .attr("width", function (index) { return outerThis.xScale(outerThis.cumTimes[index + 1] - outerThis.cumTimes[index]) })
            .attr("height", this.contentHeight)
            .attr("fill", function (index) { return (index % 2 == 0) ? backgroundColour1 : backgroundColour2; });

    rects.exit().remove();
};

/**
* Draw the chart axes.
*/
SplitsBrowser.Controls.Chart.prototype.drawAxes = function () {
    var xAxis = d3.svg.axis()
                      .scale(this.xScale)
                      .orient("top")
                      .tickFormat(this.getTickFormatter())
                      .tickValues(this.cumTimes);

    var yAxis = d3.svg.axis().scale(this.yScaleMinutes).orient("left");

    this.svgGroup.selectAll("g.axis").remove();

    this.svgGroup.append("g")
                 .attr("class", "x axis")
                 .call(xAxis);

    this.svgGroup.append("g")
                 .attr("class", "y axis")
                 .call(yAxis)
                 .append("text")
                 .attr("transform", "rotate(-90)")
                 .attr("x", -(this.contentHeight - 6))
                 .attr("y", 6)
                 .attr("dy", ".71em")
                 .style("text-anchor", "start")
                 .text("Time loss (min)");
};

/**
* Draw the lines on the chart.
* @param {Array} chartData - Array of chart data.
*/
SplitsBrowser.Controls.Chart.prototype.drawChartLines = function (chartData) {
    var outerThis = this;
    var lineFunctionGenerator = function (index) {
        return d3.svg.line()
                        .x(function (d) { return outerThis.xScale(d.x); })
                        .y(function (d) { return outerThis.yScale(d.ys[index]); })
                        .interpolate("linear");
    };

    var graphLines = this.svgGroup.selectAll("path.graphLine")
                                  .data(d3.range(this.numLines));

    graphLines.enter()
              .append("path")
              .attr("class", "graphLine")
              .attr("stroke-width", 2)
              .attr("fill", "none");

    graphLines.attr("d", function (i) { return lineFunctionGenerator(i)(chartData.dataColumns); })
                .attr("stroke", function (i) { return colours[outerThis.selectedIndexes[i] % colours.length]; });

    graphLines.exit().remove();
};

/**
* Draw legend labels to the right of the chart.
* @param {object} chartData - The chart data that contains the final time offsets.
*/
SplitsBrowser.Controls.Chart.prototype.drawCompetitorLegendLabels = function (chartData) {
    var finishColumn = chartData.dataColumns[chartData.dataColumns.length - 1];
    var outerThis = this;

    var currCompData = d3.range(this.numLines).map(function (i) {
        return {
            name: outerThis.names[i],
            textHeight: outerThis.getTextHeight(outerThis.names[i]),
            y: outerThis.yScale(finishColumn.ys[i]),
            colour: colours[outerThis.selectedIndexes[i] % colours.length]
        };
    });

    // Some ys may be too close to the previous one.  Adjust them downwards
    // as necessary.
    for (var i = 1; i < currCompData.length; ++i) {
        if (currCompData[i].y < currCompData[i - 1].y + currCompData[i - 1].textHeight) {
            currCompData[i].y = currCompData[i - 1].y + currCompData[i - 1].textHeight;
        }
    }

    var legendLines = this.svgGroup.selectAll("line.competitorLegendLine").data(currCompData);
    legendLines.enter()
                .append("line")
                .attr("class", "competitorLegendLine")
                .attr("stroke-width", 2);

    legendLines.attr("x1", this.contentWidth + 1)
                .attr("y1", function (data) { return data.y; })
                .attr("x2", this.contentWidth + legendLineWidth + 1)
                .attr("y2", function (data) { return data.y; })
                .attr("stroke", function (data) { return data.colour; });

    legendLines.exit().remove();

    var labels = this.svgGroup.selectAll("text.competitorLabel").data(currCompData);
    labels.enter()
            .append("text")
            .attr("class", "competitorLabel");

    labels.text(function (data) { return data.name; })
            .attr("x", this.contentWidth + legendLineWidth + 2)
            .attr("y", function (data) { return data.y + data.textHeight / 4; });

    labels.exit().remove();
};

/**
* Adjusts the computed values for the content size of the chart.
*
* This method should be called after any of the following occur:
* (1) the overall size of the chart changes.
* (2) the currently-selected set of indexes changes
* (3) the chart data is set.
* If you find part of the chart is missing sometimes, chances are you've
* omitted a necessary call to this method.
*/
SplitsBrowser.Controls.Chart.prototype.adjustContentSize = function () {
    var maxTextWidth = this.getMaxGraphEndTextWidth();
    this.contentWidth = Math.max(this.overallWidth - margin.left - margin.right - maxTextWidth - (legendLineWidth + 2), 100);
    this.contentHeight = Math.max(this.overallHeight - margin.top - margin.bottom, 100);
};

/**
* Sets the overall size of the chart control, including margin, axes and legend labels.
* @param {Number} overallWidth - Overall width
* @param {Number} overallHeight - Overall height
*/
SplitsBrowser.Controls.Chart.prototype.setSize = function (overallWidth, overallHeight) {
    this.overallWidth = overallWidth;
    this.overallHeight = overallHeight;
    $(_CHART_SVG_ID_SELECTOR).width(overallWidth).height(overallHeight);
    this.adjustContentSize();
};

/**
* Draws the chart.
* @param {object} chartData - Data for all of the currently-visible
*                 competitors.
* @param {Array} cumTimes - Array of cumulative times of the 'reference', in
                            units of seconds.
* @param {Array} selectedIndexes - Array of indexes of selected competitors
*                (0 in this array means the first competitor is selected, 1
*                means the second is selected, and so on.)
*/
SplitsBrowser.Controls.Chart.prototype.drawChart = function (chartData, cumTimes, selectedIndexes) {
    this.numControls = chartData.numControls;
    this.names = chartData.competitorNames;
    this.numLines = this.names.length;
    this.selectedIndexes = selectedIndexes;
    this.cumTimes = cumTimes;
    
    this.adjustContentSize();
    this.createScales(chartData);
    this.drawBackgroundRectangles();
    this.drawAxes();
    this.drawChartLines(chartData);
    this.drawCompetitorLegendLabels(chartData);
};