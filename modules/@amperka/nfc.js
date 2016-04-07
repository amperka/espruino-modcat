
var PN532_PREAMBLE = 0x00;
var PN532_STARTCODE2 = 0xFF;
var PN532_POSTAMBLE = 0x00;
var PN532_HOSTTOPN532 = 0xD4;
var PN532_COMMAND_GETFIRMWAREVERSION = 0x02;
var PN532_COMMAND_SAMCONFIGURATION = 0x14;
var PN532_COMMAND_INLISTPASSIVETARGET = 0x4A;
var PN532_COMMAND_INDATAEXCHANGE = 0x40;
var PN532_SPI_DATAWRITE = 0x01;
var PN532_SPI_DATAREAD = 0x03;
var MIFARE_ULTRALIGHT_CMD_WRITE = 0xA2;
var MIFARE_CMD_READ = 0x30;

var PN532 = function(connect) {

  connect = connect || {};

  this._SPI = connect.spi;
  this._ss = connect.csPin;
  this._irq = connect.irqPin;

  this._packetBuffer = new Uint8Array(48);
  this.imWaitingFor = new Array();
  this._maxPage = 48;
};

PN532.prototype.wakeUp = function(callback) {

  setWatch(this._IRQ.bind(this), this._irq, {repeat: true, debounce: 0.1});

  this._packetBuffer[0] = PN532_COMMAND_GETFIRMWAREVERSION;
  this._sendCommandCheckAck(this._packetBuffer, 1);
  this.imWaitingFor.push(this.SAMConfig.bind(this, callback));
};

PN532.prototype._IRQ = function(e) {
  if (e.state === false) {
    var irqWasFor = this.imWaitingFor.splice(0, 1);
    if (typeof irqWasFor[0] === 'function') {
      irqWasFor[0]();
    }
  }
};

PN532.prototype._sendCommandCheckAck = function(cmd, cmdlen) {
  cmdlen++;
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

  var send = new Uint8Array(toSend, 0, 9 + cmdlen);
  this._SPI.send(send, this._ss);

  this.imWaitingFor.push(this.readACK.bind(this));
};

PN532.prototype.SAMConfig = function(callback) {
  this._packetBuffer[0] = PN532_COMMAND_SAMCONFIGURATION;
  this._packetBuffer[1] = 0x01; // normal mode;
  this._packetBuffer[2] = 0x14; // timeout 50ms * 20 = 1 second
  this._packetBuffer[3] = 0x01; // use IRQ pin!

  this._sendCommandCheckAck(this._packetBuffer, 4);
  this.imWaitingFor.push(this.SAMConfigACK.bind(this, callback));
};

PN532.prototype.SAMConfigACK = function(callback) {
  this._packetBuffer = this.read(9);
  if (callback !== undefined) {
    callback(this._packetBuffer[6] !== 0x15);
  }
};

PN532.prototype.listen = function() {
  var buffer = new Uint8Array([PN532_COMMAND_INLISTPASSIVETARGET, 1, 0]);
  this._sendCommandCheckAck(buffer, 3);
  this.imWaitingFor.push(this.listenACK.bind(this));
};

PN532.prototype.listenACK = function() {
  this._packetBuffer = this.read(20);
  if (this._packetBuffer[7] !== 1) {
    this.emit('tag', {success: false});
    return;
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

PN532.prototype.readPage = function(page, callback) {
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

  this._sendCommandCheckAck(this._packetBuffer, 4);
  this.imWaitingFor.push(this.readPageACK.bind(this, callback));
};

PN532.prototype.readPageACK = function(callback) {
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
  this._packetBuffer[1] = 1; /* Card number */
  this._packetBuffer[2] = MIFARE_ULTRALIGHT_CMD_WRITE;
  this._packetBuffer[3] = page;
  this._packetBuffer[4] = data[0];
  this._packetBuffer[5] = data[1];
  this._packetBuffer[6] = data[2];
  this._packetBuffer[7] = data[3];
  this._sendCommandCheckAck(this._packetBuffer, 8);

  this.imWaitingFor.push(this.writePageACK.bind(this, callback));
};

PN532.prototype.writePageACK = function(callback) {
  this._packetBuffer = this.read(26);
  if (callback !== undefined) {
    callback(false, this._packetBuffer);
  }
};

PN532.prototype.read = function(length) {
  var buffer = new Uint8Array(length);
  buffer.fill(PN532_SPI_DATAREAD);
  this._SPI.send(buffer.slice(0, 1), this._ss);
  var data = this._SPI.send(buffer, this._ss);
  return data;
};

PN532.prototype.readACK = function() {
  var ackBuff = this.read(6);
  var pn532ack = new Uint8Array([0x00, 0x00, 0xFF, 0x00, 0xFF, 0x00]);
  if (ackBuff !== pn532ack) {
    print(ackBuff);
  }
  return this._pn532ack === ackBuff;
};

exports.connect = function(opts) {
  return new PN532(opts);
};
