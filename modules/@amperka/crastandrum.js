//Library for use Drum with Piezo element and MIDI signals.
//Wiki at https://gitlab.com/espruinolibs/MidiLibs/wikis/home

function min(a,b)
{
	if(a<b) return Math.round(a);
	else return Math.round(b);
}

function Output1(channel,note,max,serial,c)
{
	serial.write(0x90+channel);
	serial.write(note);
	serial.write(min(max*127*c,127));	
}

function Output2(channel,note,serial)
{
	serial.write(0x80+channel);
	serial.write(note);
	serial.write(0);
	
}

var Drum = function(pin, interval, delay, limit, serial, channel, note, size_const) {
	this.size_const=size_const;
	this.limit=limit;
	this._pin=pin;
	this.interval=interval;
	this._delay=delay;
	this._pin.mode("analog");
	this.Time;
	this.bit = false;
	this.delay = false;
	this.note=note;
	this.serial=serial;
	this.channel=channel;
	this.obj={pin:this._pin,limit:this.limit,delay:this.delay,Time:this.Time,bit:this.bit,_delay:this._delay,note:this.note,serial:this.serial,channel:this.channel,size_const:this.size_const}
	setInterval(function(obj) {
	  if(!obj.delay){
		  a = analogRead(obj.pin);
		  if(!obj.bit)
			if(a>obj.limit)
			{
				obj.max = 0;
				while(a>obj.max)
				{
					obj.max=a;
					a = analogRead(obj.pin);
				}
				Output1(obj.channel,obj.note,obj.max,obj.serial,obj.size_const);
				obj.bit=true;
			}
		  	else;
		  else if(obj.bit)
			if(a===0.0)
			{
			  obj.delay = true;
			  setTimeout(function ()    {obj.bit = false;obj.delay = false;}, obj._delay);
			  Output2(obj.channel,obj.note,obj.serial);
			}
	  }
	},this.interval,this.obj);	
}

exports.connect = function(pin, interval, delay, limit, serial, channel, note, size_const) {
  return new Drum(pin, interval, delay, limit, serial, channel, note, size_const);
};

