var render = require('./lib/render');
var to = require('./lib/to');
var weixin = require('./lib/weixin');

/*
* 1.存储到数据库
* 2.查询数据库
* 3.返回
*/
exports.handler = function() {
  //此处this==Weixin
  return function*(next) {
    //此处this=app.context
    var data = this.request.body.xml;
    var msg = to.toJs(data)
    yield this.mongo.db('weixin').collection('log_rev').insert(msg);
    switch (msg.MsgType) {
      case 'text':
        yield weixin.text(msg);
        break;
      case 'image':
        break;
      case 'voice':
        break;
      case 'event':
        switch (msg.Event) {
          case 'subscribe':
            yield weixin.default(msg)
            break;
          default:
        }
        break;
      default:
        yield weixin.default(msg);
        break;
    }
    yield next;
  };
};

exports.getIndex = function() {
  return function*(next) {
    if (this.session.user) {
      this.body = yield render('index');
    } else {
      this.redirect('/weixin/login');
    }
    yield next;
  };
};

exports.getLogin = function() {
  return function*(next) {
    if (this.session.user) {
      this.redirect('/weixin/index');
    } else {
      this.body = yield render('login');
    }
    yield next;
  };
};

exports.postLogin = function() {
  return function*(next) {
    var data = this.request.body;
    var user = yield this.mongo.db('weixin').collection('users').findOne(data, {
      _id: 0,
      password: 0
    });
    if (user) {
      this.session.user = user;
      this.redirect('/weixin/index');
    } else {
      this.body = yield render('login');
    }
    yield next;
  };
};

exports.getKs = function() {
  return function*(next) {
    if (this.session.user) {
      var keywords = yield this.mongo.db('weixin').collection('keywords').find({}, {
        _id: 0
      }).toArray();
      this.body = yield render('keywords', {
        ks: keywords
      });
    } else {
      this.redirect('/weixin/login');
    }
    yield next;
  };
}

exports.addK = function() {
  return function*(next) {
    if (this.session.user) {
      var keyword = this.request.body;
      var re = yield this.mongo.db('weixin').collection('keywords').insertMany([keyword]);
      this.body = re.result;
    } else {
      this.redirect('/weixin/login');
    }
    yield next;
  };
}

exports.logout = function() {
  return function*(next) {
    this.session = null;
    this.redirect('/weixin/login');
    yield next;
  };
}
