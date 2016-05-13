var ILI9340 = function(spi, dc, ce, rst) {
    this._spi = spi;
    this._dc = dc;
    this._ce = ce;
    this._rst = rst;
};

ILI9340.prototype.WIDTH = 320;
ILI9340.prototype.HEIGHT = 240;

ILI9340.prototype.COLOR = {
    BLACK:   0x0000,
    BLUE:    0x001F,
    RED:     0xF800,
    GREEN:   0x07E0,
    CYAN:    0x07FF,
    MAGENTA: 0xF81F,
    YELLOW:  0xFFE0, 
    WHITE:   0xFFFF
};

ILI9340.prototype.REGISTER = {
    NOP:     0x00,
    SWRESET: 0x01,
    RDDID:   0x04,
    RDDST:   0x09,

    SLPIN:   0x10,
    SLPOUT:  0x11,
    PTLON:   0x12,
    NORON:   0x13,

    RDMODE:  0x0A,
    RDMADCTL:  0x0B,
    RDPIXFMT:  0x0C,
    RDIMGFMT:  0x0A,
    RDSELFDIAG:  0x0F,

    INVOFF:  0x20,
    INVON:   0x21,
    GAMMASET: 0x26,
    DISPOFF: 0x28,
    DISPON:  0x29,

    CASET:   0x2A,
    PASET:   0x2B,
    RAMWR:   0x2C,
    RAMRD:   0x2E,

    PTLAR:   0x30,
    MADCTL:  0x36,


    MADCTL_MY:  0x80,
    MADCTL_MX:  0x40,
    MADCTL_MV:  0x20,
    MADCTL_ML:  0x10,
    MADCTL_RGB: 0x00,
    MADCTL_BGR: 0x08,
    MADCTL_MH:  0x04,

    PIXFMT:  0x3A,

    FRMCTR1: 0xB1,
    FRMCTR2: 0xB2,
    FRMCTR3: 0xB3,
    INVCTR:  0xB4,
    DFUNCTR: 0xB6,

    PWCTR1:  0xC0,
    PWCTR2:  0xC1,
    PWCTR3:  0xC2,
    PWCTR4:  0xC3,
    PWCTR5:  0xC4,
    VMCTR1:  0xC5,
    VMCTR2:  0xC7,

    RDID1:   0xDA,
    RDID2:   0xDB,
    RDID3:   0xDC,
    RDID4:   0xDD,

    GMCTRP1: 0xE0,
    GMCTRN1: 0xE1
}; 

ILI9340.prototype.writeCommand = function (data) {
    this._ce.write(0);
    this._spi.write(data, this._dc);
};

ILI9340.prototype.writeCD = function(command, data) {
    this._ce.write(0);
    this._spi.write(command, this._dc);
    this._spi.send(data);
    this._ce.write(1);
};

ILI9340.prototype.init = function(callback) {
    if (callback) {
        callback();
    }
};

ILI9340.prototype.setPixel = function(x, y, c) {
    this._ce.reset();
    this._spi.write(0x2A, this._dc);
    this._spi.write(x>>8, x, (x+1)>>8 ,x+1);
    this._spi.write(0x2B, this._dc);
    this._spi.write(y>>8, y, (y+1)>>8, y+1);
    this._spi.write(0x2C, this._dc);
    this._spi.write(c>>8, c);
    this._ce.set();
};

exports.connect = function(spi, dc, ce, rst) { 
  return new ILI9340(spi, dc, ce, rst);
};

/*

var LCD = Graphics.createCallback(LCD_WIDTH, LCD_HEIGHT, 16, {
    setPixel:function(x,y,c){
      
    },
    fillRect:function(x1,y1,x2,y2,c){
      ce.reset();
      spi.write(0x2A,dc);
      spi.write(x1>>8,x1,x2>>8,x2);
      spi.write(0x2B,dc);
      spi.write(y1>>8,y1,y2>>8,y2);
      spi.write(0x2C,dc);
      spi.write({data:String.fromCharCode(c>>8,c), count:(x2-x1+1)*(y2-y1+1)});
      ce.set();
    }
  });

  ce.write(1);
  dc.write(1);
  rst.write(0);
  setTimeout(function(){
    rst.write(1);
    setTimeout(function(){
      writeCMD(0x01);
      setTimeout(function(){
        writeCMD(0x28);ce.write(1);
        writeCD(0xCF,[0x00,0x83,0x30]);
        writeCD(0xED,[0x64,0x03,0x12,0x81]);
        writeCD(0xE8,[0x85,0x01,0x79]);
        writeCD(0xCB,[0x39,0x2C,0x00,0x34,0x02]);
        writeCD(0xF7,0x20);
        writeCD(0xEA,[0x00,0x00]);
        writeCD(0xC0,0x26);
        writeCD(0xC1,0x11);
        writeCD(0xC5,[0x35,0x3E]);
        writeCD(0xC7,0xBE);
        writeCD(0x36,0x48);
        writeCD(0x3A,0x55);
        writeCD(0xB1,[0x00,0x1B]);
        writeCD(0xF2,0x08);
        writeCD(0x26,0x01);
        writeCD(0xE0,[0x1F,0x1A,0x18,0x0A,0x0F,0x06,0x45,0x87,0x32,0x0A,0x07,0x02,0x07,0x05,0x00]);
        writeCD(0xE1,[0x00,0x25,0x27,0x05,0x10,0x09,0x3A,0x78,0x4D,0x05,0x18,0x0D,0x38,0x3A,0x1F]);
        writeCD(0xB7,0x07);
        writeCD(0xB6,[0x0A,0x82,0x27,0x00]);
        writeCMD(0x11);ce.write(1);
        setTimeout(function(){
          writeCMD(0x29);ce.write(1);
          setTimeout(function(){
            if (callback!==undefined) callback();
          },100);
        },100);
      },5);
    },5);
  },1);
  
  */