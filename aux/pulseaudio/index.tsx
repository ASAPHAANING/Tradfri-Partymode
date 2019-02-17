var PulseAudio = require('node-pulseaudio');

class Audio {
    constructor()
    {
    }


    async getVol() {
        try {
        return await PulseAudio.get();
        } catch(e) {
            console.log(e);
        }
    }

}

module.exports = new Audio()