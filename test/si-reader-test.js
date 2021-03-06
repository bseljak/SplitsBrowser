/*
 *  SplitsBrowser - SI reader tests.
 *  
 *  Copyright (C) 2000-2013 Dave Ryder, Reinhard Balling, Andris Strazdins,
 *                          Ed Nash, Luke Woodward
 *
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 2 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License along
 *  with this program; if not, write to the Free Software Foundation, Inc.,
 *  51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */
(function () {
    "use strict";
    
    var parseTime = SplitsBrowser.parseTime;
    var parseEventData = SplitsBrowser.Input.SI.parseEventData;
    var CourseClass = SplitsBrowser.Model.CourseClass;
    var Course = SplitsBrowser.Model.Course;
    var Event = SplitsBrowser.Model.Event;
    
    // Header line when control 1 is in column 46.
    var HEADER_46 = "Stno;SI card;Database Id;Surname;First name;YB;S;Block;nc;Start;Finish;Time;Classifier;Club no.;Cl.name;City;Nat;Cl. no.;Short;Long;Num1;Num2;Num3;Text1;Text2;Text3;Adr. name;Street;Line2;Zip;City;Phone;Fax;Email;Id/Club;Rented;Start fee;Paid;Course no.;Course;Km;m;Course controls;Pl;Start punch;Finish punch;Control1;Punch1;Control2;Punch2;Control3;Punch3;Control4;Punch4;\r\n";
    
    // Template for the row data that precedes the controls.
    var ROW_TEMPLATE_46 = "0;1;2;surname;forename;yearOfBirth;gender;7;nonComp;startTime;10;time;classifier;13;14;club;16;17;className;19;20;21;22;23;24;25;26;27;28;29;30;31;32;33;34;35;36;37;38;course;distance;climb;numControls;placing;startPunch;45";
    
    // Header line when control 1 is in column 44.
    // Compared to the variant above, this line has no 'S' column and has the
    // 'First name' and 'Surname' columns merged into one.
    var HEADER_44 = "Stno;SI card;Database Id;Name;YB;Block;nc;Start;Finish;Time;Classifier;Club no.;Cl.name;City;Nat;Cl. no.;Short;Long;Num1;Num2;Num3;Text1;Text2;Text3;Adr. name;Street;Line2;Zip;City;Phone;Fax;Email;Id/Club;Rented;Start fee;Paid;Course no.;Course;Km;m;Course controls;Pl;Start punch;Finish punch;Control1;Punch1;Control2;Punch2;Control3;Punch3;Control4;Punch4;\r\n";
    
    // Template for the row data that precedes the controls.
    var ROW_TEMPLATE_44 = "0;1;2;name;yearOfBirth;5;nonComp;startTime;8;time;classifier;11;12;club;14;15;className;17;18;19;20;21;22;23;24;25;26;27;28;29;30;31;32;33;34;35;36;course;distance;climb;numControls;placing;startPunch;43";
    
    // Header line when control 1 is in column 60.
    // This has various new columns.  It also doesn't always have competitor
    // names and total times.
    var HEADER_60 = "OE0014;Stno;XStno;Chipno;Database Id;Surname;First name;YB;S;Block;nc;Start;Finish;Time;Classifier;Credit -;Penalty +;Comment;Club no.;Cl.name;City;Nat;Location;Region;Cl. no.;Short;Long;Entry cl. No;Entry class (short);Entry class (long);Rank;Ranking points;Num1;Num2;Num3;Text1;Text2;Text3;Addr. surname;Addr. first name;Street;Line2;Zip;Addr. city;Phone;Mobile;Fax;EMail;Rented;Start fee;Paid;Team;Course no.;Course;km;m;Course controls;Place;Start punch;Finish punch;Control1;Punch1;Control2;Punch2;Control3;Punch3;Control4;Punch4;\r\n";
    
    // Template for the row data that precedes the controls of the 60-column variation.
    var ROW_TEMPLATE_60 = "0;1;2;compno;4;surname;forename;yearOfBirth;gender;9;nonComp;startTime;12;time;classifier;15;16;17;noOfClub;19;club;21;22;23;24;25;className;27;28;29;30;31;32;33;34;35;36;37;38;39;40;41;42;43;44;45;46;47;48;49;50;51;52;course;distance;climb;numControls;placing;startPunch;finish";
    
    var ALL_FORMATS = [
        { name: "46-column", header: HEADER_46, template: ROW_TEMPLATE_46, combineName: false, hasGender: true },
        { name: "44-column", header: HEADER_44, template: ROW_TEMPLATE_44, combineName: true, hasGender: false },
        { name: "60-column", header: HEADER_60, template: ROW_TEMPLATE_60, combineName: false, hasGender: true }
    ];
    
    /**
    * Generates a row of data for an SI-format file.
    * @param {Object} data - Object that maps key names to the data for those
    *     keys.
    * @param {Array} controls - Array of objects, each of which contains a code
    *     and a time.
    * @param {String} template - String template that describes how to generate
    *     the row.
    * @return {String} Row of data.
    */
    function generateRow(data, controls, template) {
        if (typeof template === "undefined") {
            throw new Error("No template given");
        }
        
        var row = template;
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                row = row.replace(key, data[key]);
            }
        }
        
        controls.forEach(function (control) {
            row += ";" + control.code + ";" + control.time;
        });
        
        return row + "\r\n";
    }
    
    /**
    * Returns data for a test competitor.
    * @return {Object} Test competitor data.
    */
    function getCompetitor1() {
        return {
            forename: "John",
            surname: "Smith",
            compno: "123456",
            club: "ABC",
            noOfClub: "2",
            startPunch: "11:27:45",
            startTime: "",
            time: "06:33",
            finish: "11:34:18",
            className: "Test class",
            course: "Test course",
            distance: "4.1",
            climb: "140",
            numControls: "3",
            placing: "1",
            nonComp: "",
            classifier: "",
            gender: "M",
            yearOfBirth: "1984"
        };
    }
    
    /**
    * Returns data for a second test competitor.
    * @return {Object} Test competitor data.
    */
    function getCompetitor2() {
        return {
            forename: "Fred",
            surname: "Baker",
            compno: "654321",
            club: "DEF",
            noOfClub: "6",
            startPunch: "10:30:00",
            startTime: "",
            time: "07:11",
            finish: "10:37:11",
            className: "Test class",
            course: "Test course",
            distance: "4.1",
            climb: "140",
            numControls: "3",
            placing: "2",
            nonComp: "",
            classifier: "",
            gender: "M",
            yearOfBirth: "1981"
        };
    }
    
    /**
    * Returns data for a second test competitor, on a longer course.
    * @return {Object} Test competitor data.
    */
    function getCompetitor2OnLongerCourse() {
        var comp2 = getCompetitor2();
        comp2.numControls = "4";
        comp2.distance = "5.3";
        comp2.climb = "155";
        comp2.time = "10:19";
        return comp2;
    }
    
    /**
    * Returns data for a third test competitor.
    * @return {Object} Test competitor data.
    */
    function getCompetitor3() {
        return {
            forename: "Bill",
            surname: "Jones",
            compno: "345678",
            club: "GHI",
            noOfClub: "8",
            startPunch: "11:00:00",
            startTime: "",
            time: "06:58",
            finish: "11:06:58",
            className: "Test class",
            course: "Test course",
            distance: "4.1",
            climb: "140",
            numControls: "3",
            placing: "3",
            nonComp: "",
            classifier: "",
            gender: "M",
            yearOfBirth: "1977"
        };
    }
    
    /**
    * Returns an array of test controls for competitor 1.
    * @return {Array} Test controls data.
    */
    function getControls1() {
        return [{code: "208", time: "01:50"}, {code: "227", time: "03:38"}, {code: "212", time: "06:02"}];
    }
    
    /**
    * Returns an array of test controls for competitor 1, with one blank time.
    * @return {Array} Test controls data.
    */
    function getControls1WithBlankTimeForLast() {
        return [{code: "208", time: "01:50"}, {code: "227", time: "03:38"}, {code: "212", time: ""}];
    }
    
    /**
    * Returns an array of test controls for competitor 1, with a non-numeric control code.
    * @return {Array} Test controls data.
    */
    function getControls1WithNonNumericControlCode() {
        return [{code: "208", time: "01:50"}, {code: "ST2", time: "03:38"}, {code: "212", time: "06:02"}];
    }
    
    /**
    * Returns an array of test controls for competitor 1, with all times
    * missing.
    * @return {Array} Test controls data.
    */
    function getControls1AllMissed() {
        return [{code: "208", time: "-----"}, {code: "227", time: "-----"}, {code: "212", time: "-----"}];
    }
    
    /**
    * Returns an array of test controls for competitor 2.
    * @return {Array} Test controls data.
    */ 
    function getControls2() {
        return [{code: "208", time: "02:01"}, {code: "227", time: "04:06"}, {code: "212", time: "06:37"}];
    }

    /**
    * Returns a longer list of test controls for competitor 2.
    * @return {Array} Test controls data.
    */
    function getLongerControls2() {
        return [{code: "208", time: "02:01"}, {code: "222", time: "04:06"}, {code: "219", time: "06:37"}, {code: "213", time: "09:10"}];
    }
    
    /**
    * Returns an array of test controls for competitor 3.
    * @return {Array} Test controls data.
    */ 
    function getControls3() {
        return [{code: "208", time: "01:48"}, {code: "227", time: "03:46"}, {code: "212", time: "05:59"}];
    }
    
    module("Input.SI");
    
    /**
    * Runs a test for parsing invalid data that should fail.
    * @param {QUnit.assert} assert - QUnit assert object.
    * @param {String} invalidData - The invalid string to parse.
    * @param {String} what - Description of the invalid data.
    * @param {String} exceptionName - Optional name of the exception (defaults
    *     to InvalidData.
    */
    function runInvalidDataTest(assert, invalidData, what, exceptionName) {
        try {
            parseEventData(invalidData);
            assert.ok(false, "Should throw an exception for parsing " + what);
        } catch (e) {
            assert.strictEqual(e.name, exceptionName || "InvalidData", "Exception should have been InvalidData; message is " + e.message);
        }   
    }
    
    QUnit.test("Cannot parse an empty string", function (assert) {
        runInvalidDataTest(assert, "", "an empty string", "WrongFileFormat");
    });
    
    QUnit.test("Cannot parse a string that contains only the headers", function (assert) {
        runInvalidDataTest(assert, HEADER_46, "data with a header row only", "WrongFileFormat");
    });
    
    QUnit.test("Cannot parse a string that contains only the headers and blank lines", function (assert) {
        runInvalidDataTest(assert, HEADER_46 + "\r\n\r\n\r\n", "data with a header row and blank lines only", "WrongFileFormat");
    });
    
    QUnit.test("Cannot parse a string that contains only the headers and a junk line that happens to contain a semicolon", function (assert) {
        runInvalidDataTest(assert, HEADER_46 + "\r\nrubbish;more rubbish\r\n", "data with a junk second line", "WrongFileFormat");
    });
    
    QUnit.test("Cannot parse a string that is not semicolon-delimited data", function (assert) {
        runInvalidDataTest(assert, "This is not a valid data format", "invalid data", "WrongFileFormat");
    });
    
    /**
    * Calls a test function for the result of formatting the given competitor
    * data using all formats.
    * @param {Array} competitors - Array of 2-element arrays containing
    *     competitor and control data.
    * @param {Function} testFunc - Function called with the parsed event data
    *     and the format used to generate it.
    * @param {Function} preprocessor - Function called on the event data string
    *     immediately before it is passed to the parser.  If not specified,
    *     no preprocessing is done.
    */
    function runTestOverAllFormats (competitors, testFunc, preprocessor) {
        ALL_FORMATS.forEach(function (format) {
            var text = format.header;
            competitors.forEach(function (comp) {
                var row = generateRow(comp[0], comp[1], format.template);
                if (format.combineName) {
                    row = row.replace("name", comp[0].forename + " " + comp[0].surname);
                }
                
                text += row + "\r\n";
            });
            
            if (preprocessor) {
                text = preprocessor(text);
            }
            
            var eventData = parseEventData(text);
            testFunc(eventData, format);
        });
    }
    
    QUnit.test("Can parse a string that contains a single competitor's data in all formats", function (assert) {
        runTestOverAllFormats([[getCompetitor1(), getControls1()]], function (eventData, format) {
            assert.ok(eventData instanceof Event, "Result of parsing should be an Event object");
            assert.strictEqual(eventData.classes.length, 1, "There should be one class");
            assert.ok(eventData.classes[0] instanceof CourseClass, "Class element should be a CourseClass object");
            assert.strictEqual(eventData.classes[0].numControls, 3, "Class should have three controls");
            assert.strictEqual(eventData.classes[0].name, "Test class", "Class should have correct name");
            assert.strictEqual(eventData.classes[0].competitors.length, 1, "One competitor should have been read");
            
            assert.strictEqual(eventData.courses.length, 1, "There should be one course");
            var course = eventData.courses[0];
            assert.strictEqual(course.name, "Test course", "Course name should be correct");
            assert.strictEqual(course.length, 4.1, "Course length should be correct");
            assert.strictEqual(course.climb, 140, "Course climb should be correct");
            assert.deepEqual(course.classes, [eventData.classes[0]], "The one class in the course should be the one course");
            assert.deepEqual(course.controls, ["208", "227", "212"]);
            
            var competitor = eventData.classes[0].competitors[0];
            assert.strictEqual(competitor.name, "John Smith", "Should read correct name");
            assert.strictEqual(competitor.club, "ABC", "Should read correct club");
            assert.strictEqual(competitor.startTime, 11 * 3600 + 27 * 60 + 45, "Should read correct start time");
            assert.strictEqual(competitor.yearOfBirth, 1984, "Should read correct year of birth");
            if (format.hasGender) {
                assert.strictEqual(competitor.gender, "M", "Should read correct gender");
            }
            assert.deepEqual(competitor.getAllOriginalCumulativeTimes(), [0, 110, 218, 362, 393], "Should read correct cumulative times");
            assert.ok(!competitor.isNonCompetitive, "Competitor should not be marked as non-competitive");
            assert.ok(!competitor.isNonStarter, "Competitor should not be marked as a non-starter");
            assert.ok(!competitor.isNonFinisher, "Competitor should not be marked as a non-finisher");
            assert.ok(!competitor.isDisqualified, "Competitor should not be marked as disqualified");        
            
            assert.strictEqual(eventData.classes[0].course, course, "Class should refer to its course");
        });
    });
    
    QUnit.test("Can parse a string that contains a single competitor's data with timed start", function (assert) {
        var competitor1 = getCompetitor1();
        competitor1.startTime = competitor1.startPunch;
        competitor1.startPunch = "";
        runTestOverAllFormats([[competitor1, getControls1()]], function (eventData) {
            assert.strictEqual(eventData.classes.length, 1, "There should be one class");
            assert.strictEqual(eventData.classes[0].competitors.length, 1, "One competitor should have been read");
            assert.strictEqual(eventData.classes[0].competitors[0].startTime, 11 * 3600 + 27 * 60 + 45, "Should read correct start time");
        });
    });
    
    QUnit.test("Can parse a string that contains a single competitor's data with the course distance having a comma as the decimal separator", function (assert) {
        var competitor = getCompetitor1();
        competitor.distance = "4,1";
        runTestOverAllFormats([[competitor, getControls1()]], function (eventData) {
            assert.strictEqual(eventData.courses.length, 1, "There should be one course");
            var course = eventData.courses[0];
            assert.strictEqual(course.length, 4.1, "Course length should be correct");
        });
    });
    
    QUnit.test("Can parse a string that contains a single competitor's data with the course having zero distance and climb", function (assert) {
        var competitor = getCompetitor1();
        competitor.distance = "0.0";
        competitor.climb = "0";
        runTestOverAllFormats([[competitor, getControls1()]], function (eventData) {
            assert.strictEqual(eventData.courses.length, 1, "There should be one course");
            var course = eventData.courses[0];
            assert.strictEqual(course.length, 0, "Course length should be zero");
            assert.strictEqual(course.climb, 0, "Course climb should be zero");
        });
    });
    
    QUnit.test("Can parse a string that contains a single competitor's data with the course distance in metres", function (assert) {
        var competitor = getCompetitor1();
        competitor.distance = "4100";
        runTestOverAllFormats([[competitor, getControls1()]], function (eventData) {
            assert.strictEqual(eventData.courses.length, 1, "There should be one course");
            var course = eventData.courses[0];
            assert.strictEqual(course.length, 4.1, "Course length should be correct");
        });
    });
    
    QUnit.test("Can parse a string that contains a single valid competitor's data with the placing empty", function (assert) {
        var competitor = getCompetitor1();
        competitor.placing = "";
        runTestOverAllFormats([[competitor, getControls1()]], function (eventData) {
            assert.strictEqual(eventData.classes.length, 1, "There should be one class");
            assert.strictEqual(eventData.classes[0].competitors.length, 1, "There should be one competitor");
            assert.ok(!eventData.classes[0].competitors[0].isNonCompetitive);
        });
    });
    
    QUnit.test("Can parse a string that contains a single competitor's data with the last two controls missing", function (assert) {
        var competitor1 = getCompetitor1();
        competitor1.placing = "";
        runTestOverAllFormats([[competitor1, getControls1()]], function (eventData) {
            assert.strictEqual(eventData.classes.length, 1, "There should be one class");
            assert.strictEqual(eventData.classes[0].competitors.length, 1, "There should be one competitor");
            var competitor = eventData.classes[0].competitors[0];
            assert.ok(!competitor.completed());
            assert.deepEqual(competitor.getAllOriginalCumulativeTimes(), [0, 110, null, null, 393]);
        }, function (eventDataStr) {
            for (var i = 0; i < 4; i += 1) {
                eventDataStr = eventDataStr.substring(0, eventDataStr.lastIndexOf(";"));
            }
            return eventDataStr;
        });
    });
    
    QUnit.test("Can parse a string that contains a single competitor's data with a blank time for the last control", function (assert) {
        var competitor1 = getCompetitor1();
        competitor1.placing = "";
        runTestOverAllFormats([[competitor1, getControls1WithBlankTimeForLast()]], function (eventData) {
            assert.strictEqual(eventData.classes.length, 1, "There should be one class");
            assert.strictEqual(eventData.classes[0].competitors.length, 1, "There should be one competitor");
            var competitor = eventData.classes[0].competitors[0];
            assert.ok(!competitor.completed());
            assert.deepEqual(competitor.getAllOriginalCumulativeTimes(), [0, 110, 218, null, 393]);
        });
    });
    
    QUnit.test("Can parse a string that contains a single competitor's data with control code with letters in it", function (assert) {
        var competitor1 = getCompetitor1();
        competitor1.placing = "";
        runTestOverAllFormats([[competitor1, getControls1WithNonNumericControlCode()]], function (eventData) {
            assert.strictEqual(eventData.classes.length, 1, "There should be one class");
            assert.strictEqual(eventData.classes[0].competitors.length, 1, "There should be one competitor");
            var competitor = eventData.classes[0].competitors[0];
            assert.deepEqual(competitor.getAllOriginalCumulativeTimes(), [0, 110, 218, 362, 393]);
        });
    });
    
    QUnit.test("Can parse a string ignoring a blank year of birth", function (assert) {
        var competitor1 = getCompetitor1();
        competitor1.yearOfBirth = "";
        runTestOverAllFormats([[competitor1, getControls1()]], function (eventData) {
            assert.ok(eventData instanceof Event, "Result of parsing should be an Event object");
            assert.strictEqual(eventData.classes.length, 1, "There should be one class");
            assert.strictEqual(eventData.classes[0].competitors.length, 1, "One competitor should have been read");
            assert.strictEqual(eventData.classes[0].competitors[0].yearOfBirth, null, "No year of birth should have been read");
        });
    });
    
    QUnit.test("Can parse a string ignoring an invalid year of birth", function (assert) {
        var competitor1 = getCompetitor1();
        competitor1.yearOfBirth = "This is not a valid year";
        runTestOverAllFormats([[competitor1, getControls1()]], function (eventData) {
            assert.ok(eventData instanceof Event, "Result of parsing should be an Event object");
            assert.strictEqual(eventData.classes.length, 1, "There should be one class");
            assert.strictEqual(eventData.classes[0].competitors.length, 1, "One competitor should have been read");
            assert.strictEqual(eventData.classes[0].competitors[0].yearOfBirth, null, "No year of birth should have been read");
        });
    });
    
    QUnit.test("Can parse a string that contains a single female competitor's data", function (assert) {
        var competitor1 = getCompetitor1();
        competitor1.forename = "Freda";
        competitor1.gender = "F";
        runTestOverAllFormats([[competitor1, getControls1()]], function (eventData, format) {
            assert.ok(eventData instanceof Event, "Result of parsing should be an Event object");
            assert.strictEqual(eventData.classes.length, 1, "There should be one class");
            assert.strictEqual(eventData.classes[0].competitors.length, 1, "One competitor should have been read");
            if (format.hasGender) {
                assert.strictEqual(eventData.classes[0].competitors[0].gender, "F", "Should read correct gender");
            }
        });
    });
        
    QUnit.test("Can parse a string that contains a single competitor's data ignoring a blank gender", function (assert) {
        var competitor1 = getCompetitor1();
        competitor1.gender = "";
        runTestOverAllFormats([[competitor1, getControls1()]], function (eventData, format) {
            assert.ok(eventData instanceof Event, "Result of parsing should be an Event object");
            assert.strictEqual(eventData.classes.length, 1, "There should be one class");
            assert.strictEqual(eventData.classes[0].competitors.length, 1, "One competitor should have been read");
            if (format.hasGender) {
                assert.strictEqual(eventData.classes[0].competitors[0].gender, null, "No gender should have been read");
            }
        });
    });
        
    QUnit.test("Can parse a string that contains a single competitor's data ignoring an invalid gender", function (assert) {
        var competitor1 = getCompetitor1();
        competitor1.gender = "This is not a valid gender";
        runTestOverAllFormats([[competitor1, getControls1()]], function (eventData, format) {
            assert.ok(eventData instanceof Event, "Result of parsing should be an Event object");
            assert.strictEqual(eventData.classes.length, 1, "There should be one class");
            assert.strictEqual(eventData.classes[0].competitors.length, 1, "One competitor should have been read");
            if (format.hasGender) {
                assert.strictEqual(eventData.classes[0].competitors[0].gender, null, "No gender should have been read");
            }
        });
    });
    
    QUnit.test("Can parse a string that contains a single competitor's data with LF line-endings", function (assert) {
        runTestOverAllFormats([[getCompetitor1(), getControls1()]], function (eventData) {
            assert.strictEqual(eventData.classes.length, 1, "There should be one class");
            assert.strictEqual(eventData.classes[0].competitors.length, 1, "There should be one competitor");
            var competitor = eventData.classes[0].competitors[0];
            assert.deepEqual(competitor.getAllOriginalCumulativeTimes(), [0, 110, 218, 362, 393]);
            assert.strictEqual(eventData.courses.length, 1, "There should be one course");
        }, function (eventDataStr) {
            return eventDataStr.replace(/\r\n/g, "\n");
        });
    });
    
    QUnit.test("Can parse a string that contains a single competitor's data with CR line-endings", function (assert) {
        runTestOverAllFormats([[getCompetitor1(), getControls1()]], function (eventData) {
            assert.strictEqual(eventData.courses.length, 1, "There should be one course");
        }, function (eventDataStr) {
            return eventDataStr.replace(/\r\n/g, "\r");
        });
    });
    
    QUnit.test("Can parse a string that contains a single competitor's data in 'nameless' column-60 variation", function (assert) {
        var competitor1 = getCompetitor1();
        competitor1.forename = "";
        competitor1.surname = "";
        competitor1.club = "";
        competitor1.time = "";
        competitor1.className = "";
        competitor1.startTime = competitor1.startPunch;
        competitor1.startPunch = "";
        
        var eventData = parseEventData(HEADER_60 + generateRow(competitor1, getControls1(), ROW_TEMPLATE_60));
        assert.strictEqual(eventData.classes.length, 1, "There should be one class");
        assert.strictEqual(eventData.classes[0].name, "Test course", "Class should have same name as course");
        assert.strictEqual(eventData.classes[0].competitors.length, 1, "One competitor should have been read");
        
        assert.strictEqual(eventData.courses.length, 1, "There should be one course");
        assert.strictEqual(eventData.courses[0].name, "Test course", "Course name should be correct");
        
        var competitor = eventData.classes[0].competitors[0];
        assert.strictEqual(competitor.name, competitor1.compno, "Should read competitor name as ID");
        assert.strictEqual(competitor.club, competitor1.noOfClub, "Should read club name as ID");
        assert.deepEqual(competitor.startTime, parseTime(competitor1.startTime), "Should read correct start time");
        assert.deepEqual(competitor.totalTime, 393, "Should read correct total time");
    });
    
    QUnit.test("Can parse a string that contains a single competitor's data with commas as column separators", function (assert) {
        runTestOverAllFormats([[getCompetitor1(), getControls1()]], function (eventData) {
            assert.strictEqual(eventData.classes.length, 1, "There should be one class");
            assert.strictEqual(eventData.classes[0].competitors.length, 1, "One competitor should have been read");
        }, function (eventDataStr) {
            return eventDataStr.replace(/;/g, ",");
        });
    });

    QUnit.test("Can parse a string that contains a single competitor's data with tabs as column separators", function (assert) {
        runTestOverAllFormats([[getCompetitor1(), getControls1()]], function (eventData) {
            assert.strictEqual(eventData.classes.length, 1, "There should be one class");
            assert.strictEqual(eventData.classes[0].competitors.length, 1, "One competitor should have been read");
        }, function (eventDataStr) {
            return eventDataStr.replace(/;/g, "\t");
        });
    });

    QUnit.test("Can parse a string that contains a single competitor's data with backslash characters as column separators", function (assert) {
        runTestOverAllFormats([[getCompetitor1(), getControls1()]], function (eventData) {
            assert.strictEqual(eventData.classes.length, 1, "There should be one class");
            assert.strictEqual(eventData.classes[0].competitors.length, 1, "One competitor should have been read");
        }, function (eventDataStr) {
            return eventDataStr.replace(/;/g, "\\");
        });
    });

    QUnit.test("Cannot parse a string that contains a single competitor's data with closing braces as column separators", function (assert) {
        ALL_FORMATS.forEach(function (format) {
            var eventDataStr = format.header + generateRow(getCompetitor1(), getControls1(), format.template);
            eventDataStr = eventDataStr.replace(/;/g, "}");
            runInvalidDataTest(assert, eventDataStr, "data with an unrecognised delimiter", "WrongFileFormat");
        });
    });

    QUnit.test("Cannot parse file that contains comma-separated numbers", function (assert) {
        var line1 = "";
        var line2 = "";
        for (var i = 0; i < 50; i += 1) {
            line1 += "X,";
            line2 += Math.round((1 + Math.sin(i * i)) * 232) + ",";
        }
        
        var eventDataStr = line1 + "X\n" + line2 + "0\n";
        runInvalidDataTest(assert, eventDataStr, "an empty string", "WrongFileFormat");
    });
    
    QUnit.test("Can parse a string that contains a single competitor's data with a missed control", function (assert) {
        var comp = getCompetitor1();
        comp.placing = "mp";
        var controls = getControls1();
        controls[1].time = "-----";
        runTestOverAllFormats([[comp, controls]], function (eventData) {
            assert.ok(eventData instanceof Event, "Result of parsing should be an Event object");
            assert.strictEqual(eventData.classes.length, 1, "There should be one class");
            assert.strictEqual(eventData.classes[0].competitors.length, 1, "One competitor should have been read");
        
            var competitor = eventData.classes[0].competitors[0];
            assert.deepEqual(competitor.getAllOriginalCumulativeTimes(), [0, 110, null, 362, 393], "Should read correct cumulative times");
        });
    });
    
    QUnit.test("Can parse a string that contains a single competitor's data with a missed control and remove the trailing 'mp' from the name", function (assert) {
        var comp = getCompetitor1();
        comp.surname = "Smith mp";
        comp.placing = "mp";
        var controls = getControls1();
        controls[1].time = "-----";
        runTestOverAllFormats([[comp, controls]], function (eventData) {
            assert.ok(eventData instanceof Event, "Result of parsing should be an Event object");
            assert.strictEqual(eventData.classes.length, 1, "There should be one class");
            assert.strictEqual(eventData.classes[0].competitors.length, 1, "One competitor should have been read");
            
            var competitor = eventData.classes[0].competitors[0];
            assert.strictEqual(competitor.name, "John Smith", "Should read correct name without 'mp' suffix");
            assert.deepEqual(competitor.getAllOriginalCumulativeTimes(), [0, 110, null, 362, 393], "Should read correct cumulative times");
        });
    });
    
    QUnit.test("Can parse a string that contains a single non-competitive competitor's data and remove the trailing 'n/c' from the name", function (assert) {
        var comp = getCompetitor1();
        comp.surname = "Smith n/c";
        comp.placing = "n/c";
        runTestOverAllFormats([[comp, getControls1()]], function (eventData) {
            assert.ok(eventData instanceof Event, "Result of parsing should be an Event object");
            assert.strictEqual(eventData.classes.length, 1, "There should be one class");
            assert.strictEqual(eventData.classes[0].competitors.length, 1, "One competitor should have been read");
            
            var competitor = eventData.classes[0].competitors[0];
            assert.strictEqual(competitor.name, "John Smith", "Should read correct name without 'n/c' suffix");
            assert.deepEqual(competitor.getAllOriginalCumulativeTimes(), [0, 110, 218, 362, 393], "Should read correct cumulative times");
            assert.ok(competitor.isNonCompetitive, "Competitor should be marked as non-competitive");
            assert.ok(!competitor.isNonStarter, "Competitor should not be marked as a non-starter");
            assert.ok(!competitor.isNonFinisher, "Competitor should not be marked as a non-finisher");
            assert.ok(!competitor.isDisqualified, "Competitor should not be marked as disqualified");
            assert.ok(!competitor.isOverMaxTime, "Competitor should not be marked as over max time");
        });
    });
    
    QUnit.test("Can parse a string that contains a single non-competitive competitor's data", function (assert) {
        var comp = getCompetitor1();
        comp.nonComp = "1";
        runTestOverAllFormats([[comp, getControls1()]], function (eventData) {
            assert.strictEqual(eventData.classes.length, 1, "There should be one class");
            assert.strictEqual(eventData.classes[0].competitors.length, 1, "One competitor should have been read");
            var competitor = eventData.classes[0].competitors[0];
            assert.ok(competitor.isNonCompetitive, "Competitor should be marked as non-competitive");
            assert.ok(!competitor.isNonStarter, "Competitor should not be marked as a non-starter");
            assert.ok(!competitor.isNonFinisher, "Competitor should not be marked as a non-finisher");
            assert.ok(!competitor.isDisqualified, "Competitor should not be marked as disqualified");
            assert.ok(!competitor.isOverMaxTime, "Competitor should not be marked as over max time");
        });
    });
    
    QUnit.test("Can parse a string that contains a single non-starting competitor's data", function (assert) {
        var competitor1 = getCompetitor1();
        competitor1.time = null;
        competitor1.finish = null;
        runTestOverAllFormats([[competitor1, getControls1AllMissed()]], function (eventData) {
            assert.strictEqual(eventData.classes.length, 1, "There should be one class");
            assert.strictEqual(eventData.classes[0].competitors.length, 1, "One competitor should have been read");
            var competitor = eventData.classes[0].competitors[0];
            assert.ok(!competitor.isNonCompetitive, "Competitor should not be marked as non-competitive");
            assert.ok(competitor.isNonStarter, "Competitor should be marked as a non-starter");
            assert.ok(!competitor.isNonFinisher, "Competitor should not be marked as a non-finisher");
            assert.ok(!competitor.isDisqualified, "Competitor should not be marked as disqualified");
            assert.ok(!competitor.isOverMaxTime, "Competitor should not be marked as over max time");
        });
    });
    
    QUnit.test("Can parse a string that contains a single non-starting competitor's data when flagged as non-starter", function (assert) {
        var competitor1 = getCompetitor1();
        competitor1.time = null;
        competitor1.finish = null;
        competitor1.classifier = "1";
        runTestOverAllFormats([[competitor1, getControls1AllMissed()]], function (eventData) {
            assert.strictEqual(eventData.classes.length, 1, "There should be one class");
            assert.strictEqual(eventData.classes[0].competitors.length, 1, "One competitor should have been read");
            var competitor = eventData.classes[0].competitors[0];
            assert.ok(!competitor.isNonCompetitive, "Competitor should not be marked as non-competitive");
            assert.ok(competitor.isNonStarter, "Competitor should be marked as a non-starter");
            assert.ok(!competitor.isNonFinisher, "Competitor should not be marked as a non-finisher");
            assert.ok(!competitor.isDisqualified, "Competitor should not be marked as disqualified");
            assert.ok(!competitor.isOverMaxTime, "Competitor should not be marked as over max time");
        });
    });
    
    QUnit.test("Can parse a string that contains a single non-finishing competitor's data when flagged as non-finisher", function (assert) {
        var competitor1 = getCompetitor1();
        competitor1.classifier = "2";
        var controls = getControls1();
        controls[1].time = "-----";
        runTestOverAllFormats([[competitor1, controls]], function (eventData) {
            assert.strictEqual(eventData.classes.length, 1, "There should be one class");
            assert.strictEqual(eventData.classes[0].competitors.length, 1, "One competitor should have been read");
            var competitor = eventData.classes[0].competitors[0];
            assert.ok(!competitor.isNonCompetitive, "Competitor should not be marked as non-competitive");
            assert.ok(!competitor.isNonStarter, "Competitor should not be marked as a non-starter");
            assert.ok(competitor.isNonFinisher, "Competitor should be marked as a non-finisher");
            assert.ok(!competitor.isDisqualified, "Competitor should not be marked as disqualified");
            assert.ok(!competitor.isOverMaxTime, "Competitor should not be marked as over max time");
        });
    });
    
    QUnit.test("Can parse a string that contains a single disqualified competitor's data when flagged as disqualified", function (assert) {
        var competitor1 = getCompetitor1();
        competitor1.classifier = "4";
        runTestOverAllFormats([[competitor1, getControls1()]], function (eventData) {
            assert.strictEqual(eventData.classes.length, 1, "There should be one class");
            assert.strictEqual(eventData.classes[0].competitors.length, 1, "One competitor should have been read");
            var competitor = eventData.classes[0].competitors[0];
            assert.ok(!competitor.isNonCompetitive, "Competitor should not be marked as non-competitive");
            assert.ok(!competitor.isNonStarter, "Competitor should not be marked as a non-starter");
            assert.ok(!competitor.isNonFinisher, "Competitor should not be marked as a non-finisher");
            assert.ok(competitor.isDisqualified, "Competitor should be marked as disqualified");
            assert.ok(!competitor.isOverMaxTime, "Competitor should not be marked as over max time");
        });
    });
    
    QUnit.test("Can parse a string that contains a single over-max-time competitor's data when flagged as over max time", function (assert) {
        var competitor1 = getCompetitor1();
        competitor1.classifier = "5";
        runTestOverAllFormats([[competitor1, getControls1()]], function (eventData) {
            assert.strictEqual(eventData.classes.length, 1, "There should be one class");
            assert.strictEqual(eventData.classes[0].competitors.length, 1, "One competitor should have been read");
            var competitor = eventData.classes[0].competitors[0];
            assert.ok(!competitor.isNonCompetitive, "Competitor should not be marked as non-competitive");
            assert.ok(!competitor.isNonStarter, "Competitor should not be marked as a non-starter");
            assert.ok(!competitor.isNonFinisher, "Competitor should not be marked as a non-finisher");
            assert.ok(!competitor.isDisqualified, "Competitor should not be marked as disqualified");
            assert.ok(competitor.isOverMaxTime, "Competitor should be marked as over max time");
        });
    });
    
    QUnit.test("Can parse a string that contains two competitors in the same class and course", function (assert) {
        runTestOverAllFormats([[getCompetitor1(), getControls1()], [getCompetitor2(), getControls2()]], function (eventData) {
            assert.strictEqual(eventData.classes.length, 1, "There should be one class");
            assert.ok(eventData.classes[0] instanceof CourseClass, "Array element should be a CourseClass object");
            assert.strictEqual(eventData.classes[0].numControls, 3, "Class should have three controls");
            assert.strictEqual(eventData.classes[0].competitors.length, 2, "Two competitors should have been read");
            
            assert.strictEqual(eventData.classes[0].competitors[0].name, "John Smith", "Should read correct name for first competitor");
            assert.strictEqual(eventData.classes[0].course, eventData.courses[0], "Course should be set on the class");
            assert.deepEqual(eventData.courses[0].controls, ["208", "227", "212"]);
        });
    });
    
    QUnit.test("Can parse a string that contains two competitors in the same class but different course", function (assert) {
        var comp1 = getCompetitor1();
        comp1.course = "Test course 1";
        var comp2 = getCompetitor2();
        comp2.course = "Test course 2";
        runTestOverAllFormats([[comp1, getControls1()], [comp2, getControls2()]], function (eventData) {
            assert.strictEqual(eventData.classes.length, 1, "There should be one class");
            assert.ok(eventData.classes[0] instanceof CourseClass, "Array element should be a CourseClass object");
            assert.strictEqual(eventData.classes[0].numControls, 3, "Class should have three controls");
            assert.strictEqual(eventData.classes[0].competitors.length, 2, "Two competitors should have been read");
            
            assert.strictEqual(eventData.classes[0].competitors[0].name, "John Smith", "Should read correct name for first competitor");
            assert.strictEqual(eventData.classes[0].competitors[1].name, "Fred Baker", "Should read correct name for second competitor");
            
            assert.strictEqual(eventData.courses.length, 1, "There should be one element in the courses array");
            assert.strictEqual(eventData.courses[0].name, "Test course 1", "The course name should be the first course");
            
            assert.strictEqual(eventData.classes[0].course, eventData.courses[0], "Course should be set on the class");
            assert.deepEqual(eventData.courses[0].controls, ["208", "227", "212"]);
        });
    });
    
    QUnit.test("Can parse a string that contains two competitors in the same course but different class", function (assert) {
        var comp1 = getCompetitor1();
        comp1.className = "Test class 1";
        var comp2 = getCompetitor2();
        comp2.className = "Test class 2";
        runTestOverAllFormats([[comp1, getControls1()], [comp2, getControls2()]], function (eventData) {
            assert.strictEqual(eventData.classes.length, 2, "There should be two classes");
            assert.strictEqual(eventData.classes[0].competitors.length, 1, "First class should have two competitors");
            assert.strictEqual(eventData.classes[1].competitors.length, 1, "Second class should have two competitors");
            
            assert.strictEqual(eventData.classes[0].competitors[0].name, "John Smith", "Should read correct name for first competitor");
            assert.strictEqual(eventData.classes[1].competitors[0].name, "Fred Baker", "Should read correct name for second competitor");
            
            assert.strictEqual(eventData.courses.length, 1, "There should be one element in the courses array");
            assert.strictEqual(eventData.courses[0].name, "Test course", "The course name should be correct");
            assert.deepEqual(eventData.courses[0].classes, eventData.classes, "The course should have the two classes");
            
            assert.strictEqual(eventData.classes[0].course, eventData.courses[0], "Course should be set on the first class");
            assert.strictEqual(eventData.classes[1].course, eventData.courses[0], "Course should be set on the second class");
        });
    });
    
    QUnit.test("Can parse a string that contains a course with two classes where one class is used in another course into an event with a single course", function (assert) {
        var comp1 = getCompetitor1();
        comp1.className = "Test class 1";
        comp1.course = "Test course 1";
        var comp2 = getCompetitor2();
        comp2.className = "Test class 2";
        comp2.course = "Test course 1";
        var comp3 = getCompetitor3();
        comp3.className = "Test class 2";
        comp3.course = "Test course 2";
        
        runTestOverAllFormats([[comp1, getControls1()], [comp2, getControls2()], [comp3, getControls3()]], function (eventData) {
            assert.strictEqual(eventData.classes.length, 2, "There should be two classes");
            assert.strictEqual(eventData.classes[0].competitors.length, 1, "First class should have two competitors");
            assert.strictEqual(eventData.classes[1].competitors.length, 2, "Second class should have two competitors");
            
            assert.strictEqual(eventData.classes[0].competitors[0].name, "John Smith", "Should read correct name for competitor in first class");
            assert.strictEqual(eventData.classes[1].competitors[0].name, "Fred Baker", "Should read correct name for first competitor in second class");
            
            assert.strictEqual(eventData.courses.length, 1, "There should be one element in the courses array");
            assert.strictEqual(eventData.courses[0].name, "Test course 1", "The course name should be correct");
            assert.deepEqual(eventData.courses[0].classes, eventData.classes, "The course should have the two classes");
            
            assert.strictEqual(eventData.classes[0].course, eventData.courses[0], "Course should be set on the first class");
            assert.strictEqual(eventData.classes[1].course, eventData.courses[0], "Course should be set on the second class");
            assert.deepEqual(eventData.courses[0].controls, ["208", "227", "212"]);
        });
    });
    
    QUnit.test("Can parse a string that contains two competitors on different classes and courses", function (assert) {
        var comp1 = getCompetitor1();
        comp1.className = "Test class 1";
        comp1.course = "Test course 1";
        var comp2 = getCompetitor2();
        comp2.className = "Test class 2";
        comp2.course = "Test course 2";
        comp2.numControls = "4";
        comp2.distance = "5.3";
        comp2.climb = "155";
        comp2.time = "10:19";
        
        runTestOverAllFormats([[comp1, getControls1()], [comp2, getLongerControls2()]], function (eventData) {
            assert.strictEqual(eventData.classes.length, 2, "There should be two classes");
            assert.ok(eventData.classes[0] instanceof CourseClass, "First array element should be a CourseClass object");
            assert.ok(eventData.classes[1] instanceof CourseClass, "Second array element should be a CourseClass object");
            assert.strictEqual(eventData.classes[0].numControls, 3, "First class should have three controls");
            assert.strictEqual(eventData.classes[1].numControls, 4, "Second class should have four controls");
            assert.strictEqual(eventData.classes[0].competitors.length, 1, "One competitor should have been read for the first class");
            assert.strictEqual(eventData.classes[1].competitors.length, 1, "One competitor should have been read for the second class");
            assert.strictEqual(eventData.classes[0].competitors[0].name, "John Smith", "Should read correct name for competitor on first class");
            assert.strictEqual(eventData.classes[1].competitors[0].name, "Fred Baker", "Should read correct name for competitor on second class");
            
            assert.strictEqual(eventData.courses.length, 2, "There should be two elements in the courses array");
            assert.ok(eventData.courses[0] instanceof Course, "First array element should be a Course object");
            assert.ok(eventData.courses[1] instanceof Course, "Second array element should be a Course object");
            assert.strictEqual(eventData.courses[0].name, "Test course 1", "First course should have correct name");
            assert.strictEqual(eventData.courses[1].name, "Test course 2", "Second course should have correct name");
            assert.deepEqual(eventData.courses[0].classes, [eventData.classes[0]], "First course should use the first class only");
            assert.deepEqual(eventData.courses[1].classes, [eventData.classes[1]], "Second course should use the second class only");
            assert.strictEqual(eventData.courses[0].length, 4.1, "First course length should be correct");
            assert.strictEqual(eventData.courses[0].climb, 140, "First course climb should be correct");
            assert.strictEqual(eventData.courses[1].length, 5.3, "Second course length should be correct");
            assert.strictEqual(eventData.courses[1].climb, 155, "Second course climb should be correct");
            
            assert.strictEqual(eventData.classes[0].course, eventData.courses[0], "First course should be set on the first class");
            assert.strictEqual(eventData.classes[1].course, eventData.courses[1], "Second course should be set on the second class");
            assert.deepEqual(eventData.courses[0].controls, ["208", "227", "212"]);
            assert.deepEqual(eventData.courses[1].controls, ["208", "222", "219", "213"]);
        });
    });
    
    QUnit.test("Can parse a string that contains two competitors on different classes, sorting the classes into order", function (assert) {
        var comp1 = getCompetitor1();
        comp1.className = "Test class 2";
        comp1.course = "Test course 1";
        var comp2 = getCompetitor2OnLongerCourse();
        comp2.className = "Test class 1";
        comp2.course = "Test course 2";
        var controls2 = [{code: "208", time: "02:01"}, {code: "222", time: "04:06"}, {code: "219", time: "06:37"}, {code: "213", time: "09:10"}];
        runTestOverAllFormats([[comp1, getControls1()], [comp2, controls2]], function (eventData) {
            assert.strictEqual(eventData.classes.length, 2, "There should be two elements in the classes array");
            assert.ok(eventData.classes[0] instanceof CourseClass, "First array element should be a CourseClass object");
            assert.ok(eventData.classes[1] instanceof CourseClass, "Second array element should be a CourseClass object");
            assert.strictEqual(eventData.classes[0].name, "Test class 1", "First class should be first class alphabetically");
            assert.strictEqual(eventData.classes[1].name, "Test class 2", "Second class should be second class alphabetically");
            assert.strictEqual(eventData.classes[0].competitors[0].name, "Fred Baker", "Should read correct name for competitor on first class");
            assert.strictEqual(eventData.classes[1].competitors[0].name, "John Smith", "Should read correct name for competitor on second class");
            
            assert.strictEqual(eventData.courses.length, 2, "There should be two elements in the courses array");
            assert.ok(eventData.courses[0] instanceof Course, "First array element should be a Course object");
            assert.ok(eventData.courses[1] instanceof Course, "Second array element should be a Course object");
            assert.strictEqual(eventData.courses[0].name, "Test course 1", "First course should have correct name");
            assert.strictEqual(eventData.courses[1].name, "Test course 2", "Second course should have correct name");
            assert.deepEqual(eventData.courses[0].classes, [eventData.classes[1]], "First course should use the second class only");
            assert.deepEqual(eventData.courses[1].classes, [eventData.classes[0]], "Second course should use the first class only");
            
            assert.strictEqual(eventData.classes[0].course, eventData.courses[1], "Second course should be set on the first class");
            assert.strictEqual(eventData.classes[1].course, eventData.courses[0], "First course should be set on the second class");
        });
    });
    
    QUnit.test("Can parse a string that contains two competitors on different classes, sorting the classes into order", function (assert) {
        var comp1 = getCompetitor1();
        comp1.className = "Test class 2";
        comp1.course = "Test course 1";
        var comp2 = getCompetitor2OnLongerCourse();
        comp2.className = "Test class 1";
        comp2.course = "Test course 2";
        var controls2 = [{code: "208", time: "02:01"}, {code: "222", time: "04:06"}, {code: "219", time: "06:37"}, {code: "213", time: "09:10"}];
        runTestOverAllFormats([[comp1, getControls1()], [comp2, controls2]], function (eventData) {
            assert.strictEqual(eventData.classes.length, 2, "There should be two elements in the classes array");
            assert.ok(eventData.classes[0] instanceof CourseClass, "First array element should be a CourseClass object");
            assert.ok(eventData.classes[1] instanceof CourseClass, "Second array element should be a CourseClass object");
            assert.strictEqual(eventData.classes[0].name, "Test class 1", "First class should be first class alphabetically");
            assert.strictEqual(eventData.classes[1].name, "Test class 2", "Second class should be second class alphabetically");
            assert.strictEqual(eventData.classes[0].competitors[0].name, "Fred Baker", "Should read correct name for competitor on first class");
            assert.strictEqual(eventData.classes[1].competitors[0].name, "John Smith", "Should read correct name for competitor on second class");
            
            assert.strictEqual(eventData.courses.length, 2, "There should be two elements in the courses array");
            assert.ok(eventData.courses[0] instanceof Course, "First array element should be a Course object");
            assert.ok(eventData.courses[1] instanceof Course, "Second array element should be a Course object");
            assert.strictEqual(eventData.courses[0].name, "Test course 1", "First course should have correct name");
            assert.strictEqual(eventData.courses[1].name, "Test course 2", "Second course should have correct name");
            assert.deepEqual(eventData.courses[0].classes, [eventData.classes[1]], "First course should use the second class only");
            assert.deepEqual(eventData.courses[1].classes, [eventData.classes[0]], "Second course should use the first class only");
            
            assert.strictEqual(eventData.classes[0].course, eventData.courses[1], "Second course should be set on the first class");
            assert.strictEqual(eventData.classes[1].course, eventData.courses[0], "First course should be set on the second class");
        });
    });
})();