﻿"use strict";

var Chart = SplitsBrowser.Controls.Chart;
var CompetitorData = SplitsBrowser.Model.CompetitorData;
var CourseData = SplitsBrowser.Model.CourseData;

var TEXT_WIDTHS = {
    "Fred Brown": 85,
    "John Smith": 100
};

var TEXT_HEIGHTS = {
    "Fred Brown": 12,
    "John Smith": 12
};

// Dummy functions for returning the width/height of pieces of text.
function getTextWidth(text) {
    if (text in TEXT_WIDTHS) {
        return TEXT_WIDTHS[text];
    } else {
        throw new Error("Width of text '" + text + "' not known");
    }
}

function getTextHeight(text) {
    if (text in TEXT_HEIGHTS) {
        return TEXT_HEIGHTS[text];
    } else {
        throw new Error("Height of text '" + text + "' not known");
    }
}

// Utility function to set up a chart in a parent element and mock out the
// width and height methods.
function createTestChart() {
    var div = document.createElement("div");
    var chart = new Chart(div);
    chart.getTextWidth = getTextWidth;
    chart.getTextHeight = getTextHeight;
    return chart;
}

module("Chart");

QUnit.test("Can create a chart", function (assert) {
    var competitor1 = new CompetitorData(1, "Fred", "Brown", "DEF", "10:30", [81, 197, 212, 106]);
    var competitor2 = new CompetitorData(2, "John", "Smith", "ABC", "10:00", [65, 221, 184, 100]);
    var courseData = new CourseData("Test", 3, [competitor1, competitor2]);
    var fastestTime = courseData.getFastestTime();
    var chartData = courseData.getChartData(fastestTime, [0, 1]);

    var chart = createTestChart();
    chart.setSize(1000, 1000);
    chart.drawChart(chartData, fastestTime.getCumulativeTimes(), [0, 1]);

    // Most of the testing of the chart functionality is visual, so it isn't
    // realistic to perform any automated tests for this.  However, it is
    // useful to have a check that the code at least runs without errors.  So
    // we do no further testing.

    // Tell QUnit that no assertions are expected.  If we don't do this, it
    // will complain that the test isn't testing anything.
    expect(0);
});