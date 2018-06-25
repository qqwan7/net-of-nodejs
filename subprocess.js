/**
 * Created by qqwan on 2018/6/11.
 */
process.on('message', (m, server) => {
    if (m === 'server') {
        server.on('connection', (socket) => {
            // socket.end('------end被子进程处理');
            socket.setEncoding('utf8');
            console.log('被子进程处理')
            socket.on('data', (m) => {
                console.log('子进程收到消息：', m);
                socket.write('child write')
            });
        });
    }
});