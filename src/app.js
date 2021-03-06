import angular from "angular";
import uiRouter from "@uirouter/angularjs";
import uiBootstrap from "ui-bootstrap4";
import uiNotification from "angular-ui-notification";
import "bootstrap";

import "@fortawesome/fontawesome-free/css/fontawesome.min.css";
import "@fortawesome/fontawesome-free/css/solid.min.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "angular-ui-notification/dist/angular-ui-notification.min.css";

import mainController from "./mainController";
import signatureValidatorController from "./features/signatureValidator.controller";
import signatureValidatorTemplate from "./features/signatureValidator.template.html";
import joseValidatorController from "./features/joseValidator.controller";
import joseValidatorTemplate from "./features/joseValidator.template.html";

import testRequestService from "./service/testRequestService";

import "./css/style.css";

angular
  .module("app", [uiRouter, uiBootstrap, uiNotification])
  .controller("mainController", mainController)
  .factory("testRequestService", testRequestService)
  .config([
    "$stateProvider",
    "$urlRouterProvider",
    function($stateProvider, $urlRouterProvider) {
      $stateProvider
        .state({
          name: "signatureValidator",
          url: "/signature-validator",
          controller: signatureValidatorController,
          controllerAs: "$ctrl",
          template: signatureValidatorTemplate
        })
        .state({
          name: "joseValidator",
          url: "/jose-validator",
          controller: joseValidatorController,
          controllerAs: "$ctrl",
          template: joseValidatorTemplate
        });
      $urlRouterProvider.otherwise("/signature-validator");
    }
  ])
  .directive("onReadFile", [
    "$parse",
    function($parse) {
      return {
        restrict: "A",
        scope: false,
        link: function(scope, ele, attrs) {
          let fn = $parse(attrs.onReadFile);
          ele.on("change", function(onChangeEvent) {
            let reader = new FileReader();

            reader.onload = function(onLoadEvent) {
              scope.$apply(function() {
                fn(scope, {
                  $fileContents: onLoadEvent.target.result
                });
              });
            };
            reader.readAsText(
              (onChangeEvent.srcElement || onChangeEvent.target).files[0]
            );
            ele.val("");
          });
        }
      };
    }
  ]);
