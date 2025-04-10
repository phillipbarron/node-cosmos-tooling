"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInstances = getInstances;
exports.getLoginInstance = getLoginInstance;
exports.createLogin = createLogin;
exports.getLoginAvailability = getLoginAvailability;
exports.login = login;
const certificate_service_1 = require("./certificate_service");
const proxy_service_1 = require("./proxy_service");
const COSMOS_API = 'https://cosmos.api.bbci.co.uk';
const API_VERSION = 'v1';
const AWS_REGION = 'eu-west-1';
function fetchWithAgent(url, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const agent = (0, certificate_service_1.getCertificateAgent)();
        const proxyConfig = (0, proxy_service_1.getProxyConfig)();
        return fetch(url, Object.assign(Object.assign(Object.assign({}, options), { agent: agent }), proxyConfig));
    });
}
function getInstances(serviceName, environment) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `${COSMOS_API}/${API_VERSION}/services/${serviceName}/${environment}/main_stack/instances`;
        const response = yield fetchWithAgent(url, { method: 'GET' });
        if (!response.ok) {
            if (response.status === 404) {
                console.error(`No service named ${serviceName} found in ${environment} environment`);
                process.exit(1);
            }
            throw new Error(`HTTPError: ${response.status} ${response.statusText}`);
        }
        const data = yield response.json();
        return data.instances;
    });
}
function getLoginInstance(serviceName_1, environment_1) {
    return __awaiter(this, arguments, void 0, function* (serviceName, environment, instance = 0) {
        const instances = yield getInstances(serviceName, environment);
        return instances[instance];
    });
}
function createLogin(serviceName_1, environment_1) {
    return __awaiter(this, arguments, void 0, function* (serviceName, environment, instance = 0) {
        const instanceToLoginTo = yield getLoginInstance(serviceName, environment, instance);
        const url = `${COSMOS_API}/${API_VERSION}/services/${serviceName}/${environment}/logins`;
        const payload = JSON.stringify({ instance_id: instanceToLoginTo.id });
        const response = yield fetchWithAgent(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
        });
        if (!response.ok) {
            throw new Error(`HTTPError: ${response.status} ${response.statusText}`);
        }
        return response.json();
    });
}
function getLoginAvailability(loginRefUri) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetchWithAgent(loginRefUri, { method: 'GET' });
        if (!response.ok) {
            throw new Error(`HTTPError: ${response.status} ${response.statusText}`);
        }
        return response.json();
    });
}
function login(serviceName_1, environment_1) {
    return __awaiter(this, arguments, void 0, function* (serviceName, environment, instance = 0) {
        const login = yield createLogin(serviceName, environment, instance);
        let loginAvailability = yield getLoginAvailability(login.login.ref);
        while (loginAvailability.status !== 'current') {
            console.log(`Login status: ${loginAvailability.status}`);
            yield new Promise((resolve) => setTimeout(resolve, 1000));
            loginAvailability = yield getLoginAvailability(login.login.ref);
        }
        const instanceIp = loginAvailability.instance_private_ip;
        const sshCommand = `ssh ${instanceIp},${AWS_REGION}`;
        console.log(`Executing: ${sshCommand}`);
        require('child_process').execSync(sshCommand, { stdio: 'inherit' });
    });
}
