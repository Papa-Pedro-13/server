# Руководство по 2 лабе:

Для начала установить [node.js](https://nodejs.org/en) Вообще у меня 20 версия, но 22(последняя должна быть совместима)

### В папке dexmodule находится проект с dex модулем :\

### Собирается в android studio build/(make module "dexmodule.dexmodule") или просто build. 

### Перед сборкой стоит уточнить ip-адрес компа с сервером и в случае необходимости заменить в коде private val serverBaseUrl = "http://192.168.0.101:3000" на свой адрес.

### Cам dex модуль  будет находится по пути:

```
dexmodule\dexmodule\build\intermediates\project_dex_archive\debug\dexBuilderDebug\out\com\example\dexmodule\CallLoggerModule.dex
```
 Собранный файл хранится по пути: /dex_modules

## Запускает сервер с помощью команды:
 
```
node server.js
```

## Проект приложения, которое загружает dex модуль:

[Ссылка](https://github.com/Papa-Pedro-13/bos-1)

# В этом проекте также надо заменить ip 192.168.0.101 на свой
