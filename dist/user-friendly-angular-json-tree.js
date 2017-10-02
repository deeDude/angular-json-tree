/*global angular */

/** Created by: Pedro Milheiro (pmarques@123@gmail.com), 2017-10-02 - adapted 
 * from Alex Wendland (me@alexwendland.com), 2014-08-06.
 *
 *  user-friendly-angular-json-tree
 *
 *  Directive for creating a tree-view out of a JS Object and siplaying it in 
 *  a user friendly way. Only loads sub-nodes on demand in order to improve 
 *  performance of rendering large objects.
 *
 *  Attributes:
 *      - object (Object, 2-way): JS object to build the tree from
 *      - start-expanded (Boolean, 1-way, ?=true): should the tree default to expanded
 *      - options (Object, 2-way): config options of the tree, e.g., dates format 
 *        and custom preview branch text
 *
 *  Usage:
 *      // In the controller
 *      scope.someObject = {
 *          test: 'hello',
 *          array: [1,1,2,3,5,8]
 *      };
 *      // In the html
 *      <user-friendly-json-tree object="someObject"></user-friendly-json-tree>
 *
 *  Dependencies:
 *      - utils (user-friendly-json-tree.js)
 *      - ajsRecursiveDirectiveHelper (user-friendly-json-tree.js)
 *
 *  Test: user-friendly-json-tree-test.js
 * 
 */
(function () {
    'use strict';

    var options = {};

    var utils = {
        /* See link for possible type values to check against.
         * http://stackoverflow.com/questions/4622952/json-object-containing-array
         *
         * Value               Class      Type
         * -------------------------------------
         * "foo"               String     string
         * new String("foo")   String     object
         * 1.2                 Number     number
         * new Number(1.2)     Number     object
         * true                Boolean    boolean
         * new Boolean(true)   Boolean    object
         * new Date()          Date       object
         * new Error()         Error      object
         * [1,2,3]             Array      object
         * new Array(1, 2, 3)  Array      object
         * new Function("")    Function   function
         * /abc/g              RegExp     object (function in Nitro/V8)
         * new RegExp("meow")  RegExp     object (function in Nitro/V8)
         * {}                  Object     object
         * new Object()        Object     object
         */
        is: function is(obj, clazz) {
            return Object.prototype.toString.call(obj).slice(8, -1) === clazz;
        },

        // See above for possible values
        whatClass: function whatClass(obj) {
            return Object.prototype.toString.call(obj).slice(8, -1);
        },

        // Iterate over an objects keyset
        forKeys: function forKeys(obj, f) {
            for (var key in obj) {
                if (obj.hasOwnProperty(key) && typeof obj[key] !== 'function') {
                    if (f(key, obj[key])) {
                        break;
                    }
                }
            }
        },

        unCamelCase: function (str) {
            return typeof str === "string" ? str
                .replace(/([a-z])([A-Z])/g, '$1 $2')
                .replace(/\b([A-Z]+)([A-Z])([a-z])/, '$1 $2$3')
                .replace(/^./, function (str) { return str.toUpperCase(); }) : str;
        },

        isEmpty: function (obj) {
            if (obj == null) return true;
            if (obj.length > 0) return false;
            if (obj.length === 0) return true;
            if (typeof obj !== "object") return true;
            for (var key in obj) {
                if (hasOwnProperty.call(obj, key)) return false;
            }
            return true;
        },

        includes: function (str, word) {
            return str && typeof str === 'string' && str.indexOf(word) >= 0;
        }
    };

    angular.module('user-friendly-angular-json-tree', ['ajs.RecursiveDirectiveHelper'])
        .directive('userFriendlyJsonTree', [function jsonTreeDirective() {
            return {
                restrict: 'E',
                scope: {
                    object: '=',
                    startExpanded: '&?',
                    rootName: '&?',
                    options: '='
                },
                template: '<user-friendly-json-node key="rootName() || \'Object\'" value="object" start-expanded="startExpanded()"></user-friendly-json-node>',
                link: function (scope, elem, attr) {
                    options = {
                        toggleBranchText: scope.options.toggleBranchText || 'click to expand',
                        emptyValueText: scope.options.emptyValueText || 'none',
                        dateFormat: scope.options.dateFormat || 'yyyy-MM-dd HH:mm:ss'
                    };
                }
            };
        }])
        .directive('userFriendlyJsonNode', ['ajsRecursiveDirectiveHelper', '$filter', function jsonNodeDirective(ajsRecursiveDirectiveHelper, $filter) {
            return {
                restrict: 'E',
                scope: {
                    key: '=',
                    value: '=',
                    startExpanded: '&?'
                },
                compile: function jsonNodeDirectiveCompile(elem) {
                    return ajsRecursiveDirectiveHelper.compile(elem, this);
                },
                template: ' <span class="key" ng-click="toggleExpanded()">{{formatedKey}}</span>' +
                '       <span class="leaf-value" ng-if="!isExpandable">{{value ? value : options.emptyValueText}}</span>' +
                '       <span class="branch-preview" ng-if="isExpandable" ng-show="!isExpanded" ng-click="toggleExpanded()">{{options.toggleBranchText}}</span>' +
                '       <ul class="branch-value" ng-if="isExpandable && shouldRender" ng-show="isExpanded">' +
                '           <li ng-repeat="(subkey,subval) in value">' +
                '               <user-friendly-json-node key="subkey" value="subval"></user-friendly-json-node>' +
                '           </li>' +
                '       </ul>',
                pre: function jsonNodeDirectiveLink(scope, elem, attrs) {
                    scope.options = options;
                    scope.formatedKey = utils.unCamelCase(scope.key);

                    // Set value's type as Class for CSS styling
                    elem.addClass(utils.whatClass(scope.value).toLowerCase());
                    // If the value is an Array or Object, use expandable view type
                    if (utils.is(scope.value, 'Object') || utils.is(scope.value, 'Array')) {

                        if (utils.isEmpty(scope.value)) {
                            scope.isExpandable = false;
                            scope.value = scope.options.emptyValueText;
                        } else {
                            scope.isExpandable = true;
                            // Add expandable class for CSS usage
                            elem.addClass('expandable');
                            // If directive initially has isExpanded set, also set shouldRender to true
                            if (scope.startExpanded && scope.startExpanded()) {
                                scope.shouldRender = true;
                                elem.addClass('expanded');
                            }
                            // Setup isExpanded state handling
                            scope.isExpanded = scope.startExpanded ? scope.startExpanded() : false;
                            scope.toggleExpanded = function jsonNodeDirectiveToggleExpanded() {
                                scope.isExpanded = !scope.isExpanded;
                                if (scope.isExpanded) {
                                    elem.addClass('expanded');
                                } else {
                                    elem.removeClass('expanded');
                                }
                                // For delaying subnode render until requested
                                scope.shouldRender = true;
                            };
                        }
                    } else {
                        scope.isExpandable = false;
                        // Add expandable class for CSS usage
                        elem.addClass('not-expandable');

                        //Format timestamp in milliseconds into date format
                        if (utils.includes(scope.formatedKey, 'Date') && !isNaN(scope.value)) {
                            scope.value = $filter('date')(scope.value, scope.options.dateFormat);
                        }
                    }
                }
            };
        }]);
    /** Added by: Alex Wendland (me@alexwendland.com), 2014-08-09
     *  Source: http://stackoverflow.com/questions/14430655/recursion-in-angular-directives
     *
     *  Used to allow for recursion within directives
     */
    angular.module('ajs.RecursiveDirectiveHelper', [])
        .factory('ajsRecursiveDirectiveHelper', ['$compile', function RecursiveDirectiveHelper($compile) {
            return {
                /**
                 * Manually compiles the element, fixing the recursion loop.
                 * @param element
                 * @param [link] A post-link function, or an object with function(s) registered via pre and post properties.
                 * @returns An object containing the linking functions.
                 */
                compile: function RecursiveDirectiveHelperCompile(element, link) {
                    // Normalize the link parameter
                    if (angular.isFunction(link)) {
                        link = {
                            post: link
                        };
                    }

                    // Break the recursion loop by removing the contents
                    var contents = element.contents().remove();
                    var compiledContents;
                    return {
                        pre: (link && link.pre) ? link.pre : null,
                        /**
                         * Compiles and re-adds the contents
                         */
                        post: function RecursiveDirectiveHelperCompilePost(scope, element) {
                            // Compile the contents
                            if (!compiledContents) {
                                compiledContents = $compile(contents);
                            }
                            // Re-add the compiled contents to the element
                            compiledContents(scope, function (clone) {
                                element.append(clone);
                            });

                            // Call the post-linking function, if any
                            if (link && link.post) {
                                link.post.apply(null, arguments);
                            }
                        }
                    };
                }
            };
        }]);
})();
