/**
 * Angular Selectize2
 * https://github.com/ginvoicing/angular-selectize
 **/
(function (factory) {
    'use strict';
    if (typeof exports === 'object') {
        // Node/CommonJS
        module.exports = factory(typeof angular !== 'undefined' ? angular : require('angular'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['angular'], factory);
    } else {
        // Browser globals
        if (typeof angular === 'undefined') {
            throw new Error('AngularJS framework needs to be included, see https://angularjs.org/');
        }
        factory(angular);
    }
}(function (angular) {
    'use strict';

    return angular
        .module('selectize', [])
        .value('selectizeConfig', {})
        .directive('selectize', ['selectizeConfig', selectizeDirective])
        .name;

    function selectizeDirective(selectizeConfig) {
        return {
            restrict: 'EA',
            require: '^ngModel',
            scope: {ngModel: '=', config: '=?', options: '=?', ngDisabled: '=', ngRequired: '&'},
            link: function (scope, element, attrs, modelCtrl) {

                var selectize,
                    settings = angular.extend({}, Selectize.defaults, selectizeConfig, scope.config);

                scope.options = scope.options || [];
                scope.config = scope.config || {};

                var isEmpty = function (val) {
                    if (val === null) {
                        val = undefined;
                    }
                    return (Array.isArray(val) && !val.length) || (isNaN(val)) && (val === undefined || val === null || !val.length); //support checking empty arrays
                };

                var toggle = function (disabled) {
                    disabled ? selectize.disable() : selectize.enable();
                }

                var validate = function () {
                    var isInvalid = (scope.ngRequired() || attrs.required || settings.required) && isEmpty(scope.ngModel);
                    modelCtrl.$setValidity('required', !isInvalid);
                };

                var setSelectizeOptions = function (curr, prev) {
                    if (curr) {
                        angular.forEach(prev, function (opt) {
                            if (curr.indexOf(opt) === -1) {
                                var value = opt[settings.valueField];
                                selectize.removeOption(value, true);
                            }
                        });

                        selectize.addOption(curr, true);

                        selectize.refreshOptions(false); // updates results if user has entered a query
                        setSelectizeValue();
                    }
                }

                var setSelectizeValue = function () {
                    validate();

                    selectize.$control.toggleClass('ng-valid', modelCtrl.$valid);
                    selectize.$control.toggleClass('ng-invalid', modelCtrl.$invalid);
                    selectize.$control.toggleClass('ng-dirty', modelCtrl.$dirty);
                    selectize.$control.toggleClass('ng-pristine', modelCtrl.$pristine);

                    if (!angular.equals(selectize.items, scope.ngModel)) {
                        selectize.setValue(scope.ngModel, true);
                    }
                }

                settings.onChange = function (value) {
                    var value = angular.copy(selectize.items);
                    if (settings.maxItems == 1) {
                        value = value[0]
                    }
                    modelCtrl.$setViewValue(value);

                    if (scope.config.onChange) {
                        scope.config.onChange.apply(this, arguments);
                    }
                };

                settings.onOptionAdd = function (value, data) {
                    if (scope.options.indexOf(data) === -1) {
                        scope.options.push(data);

                        if (scope.config.onOptionAdd) {
                            scope.config.onOptionAdd.apply(this, arguments);
                        }
                    }
                };

                settings.onInitialize = function () {
                    selectize = element[0].selectize;

                    setSelectizeOptions(scope.options);

                    //provides a way to access the selectize element from an
                    //angular controller
                    if (scope.config.onInitialize) {
                        scope.config.onInitialize(selectize);
                    }

                    scope.$watchCollection('options', setSelectizeOptions);
                    scope.$watch('ngModel', setSelectizeValue);
                    scope.$watch('ngDisabled', toggle);
                };

                $(element).selectize(settings);

                $(element).on('$destroy', function () {
                    if (selectize) {
                        selectize.destroy();
                        element = null;
                    }
                });
            }
        };
    }

}));
