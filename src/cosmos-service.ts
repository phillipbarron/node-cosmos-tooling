import https from 'https';
import { certificateValuesExported, getCertificateAgent } from './certificate-service';
import { getProxyConfig } from './proxy-service';

const COSMOS_API = 'https://cosmos.api.bbci.co.uk';
const API_VERSION = 'v1';
const AWS_REGION = 'eu-west-1';

interface Instance {
  id: string;
  private_ip: string;
}

interface LoginResponse {
  login: {
    ref: string;
  };
}

async function fetchWithAgent(url: string, options: RequestInit): Promise<Response> {
  const agent = getCertificateAgent();
  const proxyConfig = getProxyConfig();

  // create agent for https requests


  return fetch(url, {
    ...options,
    agent: agent as https.Agent,
    ...proxyConfig,
  });
}

export async function getInstances(serviceName: string, environment: string): Promise<Instance[]> {
  const url = `${COSMOS_API}/${API_VERSION}/services/${serviceName}/${environment}/main_stack/instances`;
  const response = await fetchWithAgent(url, { method: 'GET' });

  if (!response.ok) {
    if (response.status === 404) {
      console.error(`No service named ${serviceName} found in ${environment} environment`);
      process.exit(1);
    }
    throw new Error(`HTTPError: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.instances;
}

export async function getLoginInstance(serviceName: string, environment: string, instance: number = 0): Promise<Instance> {
  const instances = await getInstances(serviceName, environment);
  return instances[instance];
}

export async function createLogin(serviceName: string, environment: string, instance: number = 0): Promise<LoginResponse> {
  const instanceToLoginTo = await getLoginInstance(serviceName, environment, instance);
  const url = `${COSMOS_API}/${API_VERSION}/services/${serviceName}/${environment}/logins`;
  const payload = JSON.stringify({ instance_id: instanceToLoginTo.id });

  const response = await fetchWithAgent(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  });

  if (!response.ok) {
    throw new Error(`HTTPError: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function getLoginAvailability(loginRefUri: string): Promise<any> {
  const response = await fetchWithAgent(loginRefUri, { method: 'GET' });

  if (!response.ok) {
    throw new Error(`HTTPError: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function login(serviceName: string, environment: string, instance: number = 0): Promise<void> {
    if (!certificateValuesExported()) {
        console.error('Certificate values not exported. Please set the environment variables.');
        process.exit(1);
    }
  const login = await createLogin(serviceName, environment, instance);
  let loginAvailability = await getLoginAvailability(login.login.ref);

  while (loginAvailability.status !== 'current') {
    console.log(`Login status: ${loginAvailability.status}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    loginAvailability = await getLoginAvailability(login.login.ref);
  }

  const instanceIp = loginAvailability.instance_private_ip;
  const sshCommand = `ssh ${instanceIp},${AWS_REGION}`;
  console.log(`Executing: ${sshCommand}`);
  require('child_process').execSync(sshCommand, { stdio: 'inherit' });
}