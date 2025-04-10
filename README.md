# Node Cosmos Tooling

This service provides a convenient way to log into Cosmos-deployed services using the following commands:

- **issh**: For interacting with services in the **int** environment.
- **tssh**: For interacting with services in the **test** environment.
- **lssh**: For interacting with services in the **live** environment.

## Command Format

```bash
[i|t|l]ssh [service] [instance number]
```

- **i**, **t**, or **l**: Indicates the environment (`int`, `test`, or `live`).
- **service**: The name of the service you want to access.
- **instance number** (optional): Specifies the instance of the service.

### Examples

1. Log into the first instance of the `api-service` in the **int** environment:
    ```bash
    issh api-service 1
    ```

2. Log into the `db-service` in the **test** environment (default instance):
    ```bash
    tssh db-service
    ```

3. Log into the second instance of the `web-service` in the **live** environment:
    ```bash
    lssh web-service 2
    ```

This tool simplifies access to Cosmos services across different environments.