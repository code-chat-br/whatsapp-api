# Configurando Proxy - Trefik

## Uso da distribuição binária

### Download e instalação - versão 3.0.0

1. Usando curl para baixar o arquivo para a pasta atual.
```sh
curl -L https://github.com/traefik/traefik/releases/download/v3.0.0/traefik_v3.0.0_linux_amd64.tar.gz -o ./traefik_v3.0.0_linux_amd64.tar.gz
```

2. Extraindo o arquivo para o diretório `/etc/traefik`
```sh
# Extração
tar -zxvf ./traefik_v3.0.0_linux_amd64.tar.gz -C /bin
```

3. Testando o binário
```sh
traefik --help
```

## Configuração dos provedores

Acesse o arquivo de configuração do [traefik](./traefik.yml)

## Configuração dos roteadores

Acesse o arquivo de [configuração dinâmica](./dynamic/conf.yml).

1. Iniciando o serviço do `traefik` na pasta atual

  * Copie [traefik.yml](./traefik.yml) para `/etc/traefik/`
  ```sh
  cp ./traefik.yml /etc/traefik
  ```

```sh
traefik --configfile=/etc/traefik/traefik.yml
```

2. Iniciando o serviço do `traefik` em background
```sh
nohup traefik --configfile=traefik.yml &
```

3. Obtendo dados detalhados do serviço
```sh
ps -f $(pgrep -d, -x traefik)

# UID          PID    PPID  C STIME TTY      STAT   TIME CMD
# root       66459       1  0 May15 ?        Sl     1:12 traefik --configFile=conf.yml
```

4. Parando o serviço
```sh
kill -9 66459
```