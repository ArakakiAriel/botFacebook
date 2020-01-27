const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config/config.local');
const Promise = require('bluebird'),
graph = Promise.promisifyAll(require('fbgraph'));
const request = require('request-promise');


const TOKEN = config.token;
graph.setAccessToken(TOKEN);


const app = express();
app.use(bodyParser.json());

app.listen(config.port, function(){
    //console.log("Server is up listening port", config.port);
});

app.get('/', function(req, res){
    res.send('Welcome to PamBot');
});

app.get('/webhook', function(req, res){
    //console.log("ENTRO AL GET");
    if(req.query['hub.verify_token'] === 'pam'){
        //console.log(req.query['hub.challenge']);
        res.send(req.query['hub.challenge']);
    }else{
        res.send('Not allow to enter');
    }
});

app.post('/webhook', async function(req, res){
    try{
        //console.log("Entro al POST");
        var data = req.body;
        if(data.object == 'page'){
            await data.entry.forEach(async function(pageEntry){
                await pageEntry.messaging.forEach(async function(messagingEvent){
                    //Acá podemos encontrar datos del mensaje
                    if(messagingEvent.message){
                        const data = await receiveMessage(messagingEvent);
                    }
                });
            });
        }
    
        res.sendStatus(200);
    }
    catch(e){
        //console.log("ERROR:", e);
        res.sendStatus(500);
    }
});

async function receiveMessage(event){
    const senderId = event.sender.id;
    const messageText = event.message.text;
    let finalMessage = '';
    var name = "Persona quemada";

    //console.log("Entro");

    const response = await graph.get(senderId, async function (err, res){
        if(err) return err;
        console.log("no hay error", res.first_name);
        return await res;
    });
     console.log("RESPUESTA DEL API FB", response);

     console.log(response.first_name);
    name = response.first_name;

    console.log("nombre after", name);

      

    if(messageText.includes('precio')){
        finalMessage = `Hola ${name} ¡Gracias por escribirnos! Te contactaremos con un asesor de tu área que te brindará toda la información. Para ello sería necesario que nos compartas los siguientes datos: 
        \n-Nombre completo
        \n-Mail
        \n-Teléfono
        \n-Zona de residencia. 
        \nAsí puede contactarte un asesor comercial a la brevedad.`;
    }else{
        finalMessage = 'A neutral response is sent'
    }

   await sendMessageText(senderId, finalMessage)
};
async function getUserData(senderId){
    
}

function sendMessageText(recipientId, message){
    const messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: message
        }
    };

    callSendAPI(messageData);
};

function callSendAPI(messageData){
    request({
        uri: "https://graph.facebook.com/v5.0/me/messages",
        qs: {access_token: TOKEN},
        method: 'POST',
        json: messageData
    }, function(err, res, data){
        if(err){
            console.log("Error trying to send the message", err);
        }else{
            console.log("Message sent successfully");
        }
    })
}