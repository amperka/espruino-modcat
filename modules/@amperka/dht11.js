var DHT11 = function(pin) {
  this._pin = pin;
};

  this._increment = E.asm('int()',
    'adr    r1, data',
    'ldr    r0, [r1]',
    'add    r0, #1',
    'str    r0, [r1]',
    'bx lr',
    'nop',
    'data:',
    '.word    0x0'
  );

  setWatch(this._increment, self._oscPin, {irq: true});

DHT11.prototype.read = function(units) {
    // буффер данных
    var bits = new Uint8Array(5);
    var cnt = 7;
    var idx = 0;

    // согласование с датчиком
    pinMode(this._pin, OUTPUT);
    digitalPulse(this._pin, 0, [18, 0.4]);
    setTimeout(function() {
      pinMode(this._pin, INPUT);

      // проверка отвечает ли датчик
      unsigned int loopCnt = 10000;
      while (digitalRead(_pin) == LOW)
          if (loopCnt-- == 0) return DHT_ERROR_TIMEOUT;

      loopCnt = 10000;
      while (digitalRead(_pin) == HIGH)
          if (loopCnt-- == 0) return DHT_ERROR_TIMEOUT;

      // Считываем 40 бит
      for (int i = 0; i < 40; i++) {
          loopCnt = 10000;
          while (digitalRead(_pin) == LOW)
              if (loopCnt-- == 0) return DHT_ERROR_TIMEOUT;

          unsigned long t = micros();
          loopCnt = 10000;
          while (digitalRead(_pin) == HIGH)
              if (loopCnt-- == 0) return DHT_ERROR_TIMEOUT;

          if ((micros() - t) > 40) bits[idx] |= (1 << cnt);
          // следующий байт?
          if (cnt == 0) {
              cnt = 7;
              idx++;
          } else {
              cnt--;
          }
      }

      // запись данных
      _humidity    = bits[0];
      _temperatureC = bits[2];
      // проверка контрольной суммы
      uint8_t sum = bits[0] + bits[2];

      if (bits[4] != sum) return DHT_ERROR_CHECKSUM;
      return DHT_OK;
    }, 19);

};

exports.connect = function(pin) {
  return new DHT11(pin);
};
