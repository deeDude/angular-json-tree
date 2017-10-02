describe('The user friendly json-tree viewer directive', function () {
    'use strict';

    var scope, compile;

    beforeEach(function () {
        module('user-friendly-angular-json-tree');
        inject(function ($compile, $rootScope) {
            scope = $rootScope.$new();
            compile = $compile;
        });
        scope.someObject = {
            test: 'hello',
            array: [1,1,2,3,5,8],
            subObj: {

                subTest: 'hi',
                subArray: [2,1,3,4,7,11]
            },
            withDate: 1505296820331,
            emptyVal: ''
        };
        scope.options = {
            toggleBranchText: 'click to expand',
            emptyValueText: 'none',
            dateFormat: 'yyyy-MM-dd HH:mm:ss'
        };
    });

    var unexpandedHtml = '<user-friendly-json-tree object="someObject" options="options"><user-friendly-json-tree>';
    var expandedHtml = '<user-friendly-json-tree object="someObject" start-expanded="true" options="options"><user-friendly-json-tree>';

    it('should generate an un-expanded tree', function () {
        var html = unexpandedHtml;
        var elem = angular.element(html);
        compile(elem)(scope);
        scope.$digest();
        expect(elem.html()).not.toMatch(/.+?<ul .+?>/);
    });

    it('should generate an expanded tree', function () {
        var html = expandedHtml;
        var elem = angular.element(html);
        compile(elem)(scope);
        scope.$digest();
        expect(elem.html()).toMatch(/.+?<ul .+?>/);
    });

    it('should have no subnodes until click', function () {
        var html = unexpandedHtml;
        var elem = angular.element(html);
        compile(elem)(scope);
        scope.$digest();
        // Shouldn't have loaded subnodes
        expect(elem.html()).not.toMatch(/.+?<ul .+?>/);
        // Click the 'key' element
        var keyElem = elem[0].querySelector('.key');
        keyElem.click();
        // Should have loaded subnodes
        expect(elem.html()).toMatch(/.+?<ul .+?>/);
    });

    it('should toggle expansion on click', function () {
        var html = unexpandedHtml;
        var elem = angular.element(html);
        compile(elem)(scope);
        scope.$digest();
        // Get 'key' element
        var keyElem = elem[0].querySelector('.key');
        // Shouldn't have expanded class
        expect(elem.html()).not.toMatch(/.+?class=".+?expanded.+?".+?>/);
        // Click the 'key' element
        keyElem.click();
        // Should have expanded class
        expect(elem.html()).toMatch(/.+?class=".+?expanded.+?".+?>/);
        // Click the 'key' element
        keyElem.click();
        // Shouldn't have expanded class
        expect(elem.html()).not.toMatch(/.+?class=".+?expanded.+?".+?>/);
    });

    it('should have custom toggle branch text', function () {
        var html = unexpandedHtml;
        var elem = angular.element(html);
        compile(elem)(scope);
        scope.$digest();
        var branchPreviewElem = elem[0].querySelector('.branch-preview');
        expect(branchPreviewElem.textContent).toBe(scope.options.toggleBranchText);
    });

     it('should have empty value text', function () {
        var html = expandedHtml;
        var elem = angular.element(html);
        compile(elem)(scope);
        scope.$digest();
        
        var emptyValText = '';
        
        var keysElems = elem[0].querySelectorAll('user-friendly-json-node .key');
        for (var i = 0; i < keysElems.length; ++i) {
            var keyElem = keysElems[i];
            if(keyElem.textContent === 'Empty Val') {
                emptyValText = keyElem.nextElementSibling.textContent;
                break;
            }
        }

        expect(emptyValText).toBe(scope.options.emptyValueText);
    });

    it('should have formatted date from timestamp (in ms)', function () {
        var html = expandedHtml;
        var elem = angular.element(html);
        compile(elem)(scope);
        scope.$digest();
        
        var withDateText = '';
        var keysElems = elem[0].querySelectorAll('user-friendly-json-node .key');
        for (var i = 0; i < keysElems.length; ++i) {
            var keyElem = keysElems[i];
            if(keyElem.textContent === 'With Date') {
                withDateText = keyElem.nextElementSibling.textContent;
                break;
            }
        }

        expect(withDateText).toMatch(/^\d{4}-\d{2}-\d{2}[ ]\d{2}\:\d{2}\:\d{2}$/);
    });
});
