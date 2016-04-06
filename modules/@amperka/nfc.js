
var PN532_PREAMBLE = 0x00;
var PN532_STARTCODE2 = 0xFF;
var PN532_POSTAMBLE = 0x00;
var PN532_HOSTTOPN532 = 0xD4;
var PN532_COMMAND_GETFIRMWAREVERSION = 0x02;
var PN532_COMMAND_SAMCONFIGURATION = 0x14;
var PN532_COMMAND_INLISTPASSIVETARGET = 0x4A;
var PN532_COMMAND_INDATAEXCHANGE = 0x40;
var PN532_SPI_STATREAD = 0x02;
var PN532_SPI_DATAWRITE = 0x01;
var PN532_SPI_DATAREAD = 0x03;
var PN532_SPI_READY = 0x01;
var MIFARE_ULTRALIGHT_CMD_WRITE = 0xA2;
var MIFARE_CMD_READ = 0x30;

var PN532 = function(connect) {

  connect = connect || {};

  this._SPI = connect.spi;
  this._ss = connect.csPin;
  this._irq = connect.irqPin;

  this._pn532ack = new Uint8Array([0x00, 0x00, 0xFF, 0x00, 0xFF, 0x00]);
  this._pn532responseFirmwarevers = new Uint8Array([
    0x00,
    0xFF,
    0x06,
    0xFA,
    0xD5,
    0x03
  ]);
  this._packetBuffer = new Uint8Array(64);

  this.imWaitingFor = new Array();

  this._maxPage = 48;
};

PN532.prototype.wakeUp = function(callback) {

  console.log('wakeUp function');

  setWatch(this.IRQ.bind(this), this._irq, {repeat: true, debounce: 0.1});

  this._packetBuffer[0] = PN532_COMMAND_GETFIRMWAREVERSION;
  this.sendCommandCheckAck(this._packetBuffer, 1);
  this.imWaitingFor.push(this.SAMConfig.bind(this, callback));
};

PN532.prototype.IRQ = function(e) {
  console.log('IRQ state', e.state);
  if (e.state === false) {
    // console.log('IRQ function', this.imWaitingFor);
    var irqWasFor = this.imWaitingFor.splice(0, 1);
    if (typeof irqWasFor[0] === 'function') {
      irqWasFor[0]();
    }
  }
};

PN532.prototype.sendCommandCheckAck = function(cmd, cmdLen) {
  console.log('sendCommandCheckAck function');
  this.writeCommand(cmd, cmdLen);
  // this.imWaitingFor.push('IRQ_readACK');
  this.imWaitingFor.push(this.readACK.bind(this));
};

PN532.prototype.printHex = function(data) {
  for (var i in data) {
    data[i] = data[i].toString(16) + ' ';
  }
  print(data);
};

PN532.prototype.version = function(callback) {
  this._packetBuffer[0] = PN532_COMMAND_GETFIRMWAREVERSION;
  this.sendCommandCheckAck(this._packetBuffer, 1);
  this.imWaitingFor.push(this.versionACK.bind(this, callback));
};

PN532.prototype.versionACK = function(callback) {

  var result = this.read(13);
  console.log('versionACK:', result);
  if (result !== this._pn532responseFirmwarevers) {
    callback(true);
    return;
  }
  // 6 - offset for data
  var offset = 6;
  var response = result[offset++];
  response <<= 8;
  response |= result[offset++];
  response <<= 8;
  response |= result[offset++];
  response <<= 8;
  response |= result[offset++];

  callback(false, response);
};

PN532.prototype.SAMConfig = function(callback) {
  console.log('SAMConfig function');
  this._packetBuffer[0] = PN532_COMMAND_SAMCONFIGURATION;
  this._packetBuffer[1] = 0x01; // normal mode;
  this._packetBuffer[2] = 0x14; // timeout 50ms * 20 = 1 second
  this._packetBuffer[3] = 0x01; // use IRQ pin!

  this.sendCommandCheckAck(this._packetBuffer, 4);
  // this.imWaitingFor.push('IRQ_SAMConfigACK');
  this.imWaitingFor.push(this.SAMConfigACK.bind(this, callback));
};

PN532.prototype.SAMConfigACK = function(callback) {
  console.log('SAMConfigACK function');
  this._packetBuffer = this.read(9);
  if (callback !== undefined) {
    callback(this._packetBuffer[6] !== 0x15);
  }
  // this.imWaitingFor.push('configured');
};

PN532.prototype.listen = function() {
  console.log('listen function');
  var buffer = new Uint8Array([PN532_COMMAND_INLISTPASSIVETARGET, 1, 0]);

  this.sendCommandCheckAck(buffer, 3);
  // this.imWaitingFor.push('IRQ_readPassiveTargetIDACK');
  this.imWaitingFor.push(this.listenACK.bind(this));
};

PN532.prototype.listenACK = function() {
  console.log('listenACK function');
  this._packetBuffer = this.read(20);
  if (this._packetBuffer[7] !== 1) {
    this.emit('tag', {success: false});
  }
  var ATQA = this._packetBuffer[9];
  ATQA <<= 8;
  ATQA |= this._packetBuffer[10];

  var uid = new Array(this._packetBuffer[12]);
  for (var i = 0; i < this._packetBuffer[12]; i++) {
    uid[i] = this._packetBuffer[13+i];
  }

  this.emit('tag', false, {uid: uid, ATQA: ATQA});
};

PN532.prototype.skipIRQ = function() {
  console.log('passIRQ function');
};

PN532.prototype.sleep = function() {
  console.log('sleep function');
  this._packetBuffer[0] = 0x16;
  this._packetBuffer[1] = 0x20;
  this._packetBuffer[2] = 0x00;

  var len = this.imWaitingFor;
  this.imWaitingFor.splice(0, len);

  this.sendCommandCheckAck(this._packetBuffer, 3);
  this.imWaitingFor.push(this.sleepACK.bind(this));
  this.imWaitingFor.push(this.skipIRQ.bind(this));
};

PN532.prototype.sleepACK = function() {
  console.log('sleepACK function');
  var success = true;
  this._packetBuffer = this.read(8);
  if (this._packetBuffer[6] !== 0x17) {
    console.log('ERROR sleep:', this._packetBuffer.slice(6, 8));
  }
  var error = this._packetBuffer[7] & 0x3F;
  if (error !== 0) {
    console.log('ERROR sleep:', error);
  }
  this.emit('sleep', {success: success});
};

PN532.prototype.readPage = function(page, callback) {
  console.log('readPage function');
  if (page >= this._maxPage) {
    if (callback !== undefined) {
      callback(true);
    }
    return;
  }
  this._packetBuffer[0] = PN532_COMMAND_INDATAEXCHANGE;
  this._packetBuffer[1] = 1;               // Card number
  this._packetBuffer[2] = MIFARE_CMD_READ; // Mifare Read command = 0x30
  this._packetBuffer[3] = page;            // Page Number (0..63 in most cases)

  this.sendCommandCheckAck(this._packetBuffer, 4);
  this.imWaitingFor.push(this.readPageACK.bind(this, callback));
};

PN532.prototype.readPageACK = function(callback) {
  console.log('readPageACK function');
  var error = true;
  this._packetBuffer = this.read(26);
  if (this._packetBuffer[7] !== 0x00) {
    if (callback !== undefined) {
      callback(error);
    }
    return;
  }
  var buffer = this._packetBuffer.slice(8, 12);
  callback(!error, buffer);
};

PN532.prototype.writePage = function(page, data, callback) {
  if (page >= this._maxPage) {
    if (callback !== undefined) {
      callback(true);
    }
    return;
  }

  this._packetBuffer[0] = PN532_COMMAND_INDATAEXCHANGE;
  this._packetBuffer[1] = 1;                      /* Card number */
  this._packetBuffer[2] = MIFARE_ULTRALIGHT_CMD_WRITE;
  this._packetBuffer[3] = page;
  this._packetBuffer[4] = data[0];
  this._packetBuffer[5] = data[1];
  this._packetBuffer[6] = data[2];
  this._packetBuffer[7] = data[3];
  this.sendCommandCheckAck(this._packetBuffer, 8);

  this.imWaitingFor.push(this.writePageACK.bind(this, callback));
};

PN532.prototype.writePageACK = function(callback) {
  this._packetBuffer = this.read(26);
  if (callback !== undefined) {
    callback(false, this._packetBuffer);
  }
};

PN532.prototype.readACK = function() {
  console.log('readACK function');
  var ackBuff = this.read(6);
  if (ackBuff !== this._pn532ack) {
    console.log('readACK function ERROR');
    this.printHex(ackBuff);
    console.log('ackBuff not correct');
  }
  return this._pn532ack === ackBuff;
};

PN532.prototype.read = function(length) {

  // print('Reading: ');

  var send = new Uint8Array([PN532_SPI_DATAREAD]);
  this._SPI.send(send, this._ss);
  var send2 = new Uint8Array(length);
  send2.fill(PN532_SPI_DATAREAD);
  var data = this._SPI.send(send2, this._ss);
  // console.log('Reading data:', data);
  return data;
};

PN532.prototype.writeCommand = function(cmd, cmdlen) {

  cmdlen++;

  // print('writeCommand Sending: ');

  var toSend = [
    PN532_SPI_DATAWRITE,
    PN532_PREAMBLE,
    PN532_PREAMBLE,
    PN532_STARTCODE2,
    cmdlen,
    ~cmdlen + 1,
    PN532_HOSTTOPN532
  ];

  var checksum = new Uint8Array(1);

  checksum[0] = PN532_PREAMBLE + PN532_PREAMBLE
            + PN532_STARTCODE2 + PN532_HOSTTOPN532;

  for (var i = 0; i < cmdlen - 1; i++) {
    toSend.push(cmd[i]);
    checksum[0] += cmd[i];
  }

  toSend.push(~checksum[0]);
  toSend.push(PN532_POSTAMBLE);

  // print(toSend);

  var send = new Uint8Array(toSend, 0, 9 + cmdlen);

  this._SPI.send(send, this._ss);
};

exports.connect = function(opts) {
  return new PN532(opts);
};
