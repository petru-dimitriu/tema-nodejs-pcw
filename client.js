var express = require('express');
var app = express();

var io = require('socket.io-client');

const socket = io('http://localhost:8082');
