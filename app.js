/**
 * Created by qqwan on 2018/6/4.
 */
const feathers = require('@feathersjs/feathers')
const configuration = require('feathers-configuration')
const path = require('path')
const cluster = require('cluster')
const app = feathers()
const os = require('os')
app.configure(configuration())
if (cluster.isMaster) {
    let cores = os.cpus().length
    var i = 0;
    while (i < cores) {
        console.log('Forking node '+i);
        cluster.fork();
        i++;
    }
    const routers = require('./src/router')
    var router = routers.getRouter();
    router.listen(app.get("ports").http, function() {
        console.log("http start on "+app.get("ports").http );
    });
    // child_process////////////////////
    // const child_process = require('child_process');
    // child_process.exec('test.bat', (err, stdout, stderr) => {
    //     if (err) {
    //         console.error(err);
    //         return;
    //     }
    //     console.log(stdout);
    // })
    const subprocess = require('child_process').fork('subprocess.js');
    // 开启 server 对象，并发送该句柄。
    const server = require('net').createServer();
    server.on('connection', (socket) => {
        socket.setEncoding('utf8');
        // socket.end('----end被父进程处理');
        console.log('被父进程处理')
        socket.on('data', (m) => {
            console.log('父进程收到消息：', m);
            socket.write('parent write')
        });
    });
    server.listen(1337, '0.0.0.0', () => {
        subprocess.send('server', server);
    });
    // child_process end////////////////////
    // child_process////////////////////
} else {
    const net = require('net');
    const fs = require('fs');
    const uuidv4 = require('uuid/v4')
    const options = {
        key: fs.readFileSync(path.join(__dirname, './private_key2.pem')),
        cert: fs.readFileSync(path.join(__dirname,'certkey.pem')),
        // This is necessary only if using the client certificate authentication.
        requestCert: false
        // This is necessary only if the client uses the self-signed certificate.
    };
    // net TCP
    const server = net.createServer(options,(socket) => {
        console.log('server connected',
            socket.authorized ? 'authorized' : 'unauthorized');
        socket.setEncoding('utf8');
        var uuid = uuidv4().toString().replace(new RegExp("-", "gm"), "");
        socket.sessionId = uuid;
        socket.setKeepAlive(true, 20000);
        socket.on('data', function (data) {
            console.log(data)
        })
        socket.on('error', function(data) {
            if(socket.mac != undefined || socket.realIp != undefined){
                if(socket.realIp != '127.0.0.1' && socket.realIp != undefined){
                    console.log("mac :"+ socket.mac +"  ip:" + socket.realIp+"  socket destroy " );
                }
            }
            clearSocket(socket);
        });
        socket.on('close', function(data) {
            //在socket断开的情况下发送消息，会报错，close事件中可以捕捉到  保存至数据库  yxxu 说暂时不做
            if(socket.mac != undefined || socket.realIp != undefined){
                if(socket.realIp != '127.0.0.1' && socket.realIp != undefined){
                    console.log("mac :"+ socket.mac +"  ip:" + socket.realIp+"  socket destroy " );
                }
            }
            clearSocket(socket);
        });
        socket.on('end', function() {
            //在socket断开的情况下发送消息，会报错，close事件中可以捕捉到  保存至数据库  yxxu 说暂时不做
            console.log("end  :");
        });
        socket.setTimeout(90000); //设置90秒的socket超时 socket超时后 清空内存中的socket
        socket.on('timeout', function() {
            console.log("mac :"+ socket.mac +"  ip:" + socket.realIp+"  timeout " );
            clearSocket(socket);
            //console.log('sessionId:  '+socket.sessionId + 'timeout');
        });
    });

    server.listen(app.get("ports").tcp,'0.0.0.0', () => {
        console.log('server bound on '+ app.get("ports").tcp);
    });
    function clearSocket(socket) {
        socket.destroy();
    }
   // dgram UDP 客户端地址必须同udpServer配置成127.0.0.1 or localhost 或ip地址
    const dgram = require('dgram')
    const udpServer = dgram.createSocket('udp4')
    udpServer.on('message', (msg, rinfo) => {
        console.log(`服务器收到：${msg} 来自 ${rinfo.address}:${rinfo.port}`);
        udpServer.send('ttttt', 61131, '192.168.126.147', (err) => { // 返回客户端

        })
    })
    udpServer.on('error', (err) => {
        console.log(`服务器异常：\n${err.stack}`);
        udpServer.close();
    });
    udpServer.on('listening', () => {
        const address = udpServer.address();
        console.log(`服务器监听 ${address.address}:${address.port}`);
    });
    udpServer.bind({
        address: '192.168.126.147',
        port: 8999,
        exclusive: true
    })
    // const message = Buffer.from('Some bytes');
    // const client = dgram.createSocket('udp4');
    // client.send(message, 41234, 'localhost', (err) => {
    //     client.close();
    // });
    // socket.io
   function testApp() {
       var app = require('express')();
       var http = require('http').createServer(); //  tong require('http').Server
       var io = require('socket.io')(http);

       app.get('/', function(req, res){
           res.sendFile(__dirname + '/index.html');
       });

       io.on('connection', function(socket){
           socket.on('chat message', function(msg){
               io.emit('chat message', msg);
               console.log('--------' + msg);
           });
           socket.on('disconnect', function(){
               console.log('-------user disconnected');
           });
       });

       http.listen(8166, function(){
           console.log('listening on *:8166');
       });
   }
    testApp()
}
// https://blog.csdn.net/lovemenghaibin/article/details/51263774
// https://juejin.im/entry/5701f343c4c97100590fd424
// https://blog.csdn.net/whb20081815/article/details/67640804