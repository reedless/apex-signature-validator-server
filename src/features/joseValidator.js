let template = `
<div class="row" style='text-align:center'>
    <button type="button" class="btn btn-lg btn-default" ng-click="displayJOSEMenu(toggleJOSE)">
        <span class="glyphicon glyphicon-sunglasses"></span> Verify JOSE
    </button>
</div>

<div ng-if="toggleJOSE">
    <div class="heading">
        <h3>JSON Object Signing and Encryption (JOSE)</h3>
    </div>
    <div class="row">
        <div class="col-md-3">
            <b>JOSE Standard</b>
            <select ng-options="o as o for o in jwt_standards" ng-model="selectedJWTStandard" class="form-control"></select>
        </div>
        <div class="col-md-12">
            <h4>Input</h4>
            <small>API Response (JSON) from APEX</small>
            <textarea rows="12" class="form-control" ng-model="input" placeholder="Paste the API response here"></textarea>
        </div>
        <div class="col-md-12">
            <div ng-if='selectedJWTStandard === "JWS"'>
                <h4>Public Certificate/Key</h4>
                <small>To verify against the JWT's signature</small>
            </div>
            <div ng-if='selectedJWTStandard === "JWE"'>
                <h4>Private Key</h4>
                <small>To decrypt the JWT</small>
            </div>
            <textarea rows="12" class="form-control" ng-model="key" placeholder="Paste the key contents here"></textarea>
        </div>
        <div class="col-md-12">
            <span style="float:right; margin-top:5px">
                <input type="button" value="Verify JWT" class="btn btn-default" ng-click="verifyJOSE(selectedJWTStandard,input,key)">
            </span>
        </div>

        <div class="col-md-12">
            <h4>Output</h4>
            <textarea rows="8" class="form-control" ng-model="output" placeholder="Parsed Output"></textarea>
        </div>
    </div>
</div>
`