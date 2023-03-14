
# Visualizing Semantically Annotated Sensor Data

## About the project

The Project was developed for the vitualisation of ttl-Data.

However the ttl-data has to be in the format:

    <"value"> a ns2:Observation ;
    ns2:hasResult [ ns1:numericalValue "value" ;
            ns1:unit <"unit_type"> ] ;
    ns2:hasSimpleResult "value"^^<"unit type"> ;
    ns2:madeBySensor <"name"> ;
    ns2:observedProperty <"name"> ;
    ns2:resultTime "YYYY-MM-DDTHH:MM:SS+MM:MM"^^xsd:dateTime .

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 13.0.2.

## Getting Started

The list you need to install for this project. We strongly recommend to take either linux or MacOs

Installing [Node.js](https://nodejs.org/en/) 

for the terminal

```
apt install nodejs
```

afterwards the npm 

```
apt install npm
```

The programm uses Angular. You can download it [here](https://angular.io/). We used Visual Studio Code as development environment. 

```
npm install -g @angular/cli
```

Echarts for the showing the diagram

```
npm install echarts
```

ng2-charts for showing the diagram
```
npm install --save ng2-charts
```

bootstrap for one time choose 

```
ng add @ng-bootstrap/ng-bootstrap
```

Date-fns for better handeling the date in thr 

```
npm install date-fns chartjs-adapter-date-fns --save
```

Angular Material for showing all the buttons

``` 
ng add @angular/material
```

## starting 

Just start navigate in the folder ttl-dahboard and tipp 
``` 
ng serve
```
or open a development environment and tip in the terminal 
``` 
ng serve
```
Go the webside [http://localhost:4200/](http://localhost:4200/). if the aplication is on another port then just tipe "http://localhost:XXXX/" and for XXXX the port Number.

Then you can use the webpage

