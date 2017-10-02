const defaultAdapter = require('../../../lib/adapters/default');

const sinon = require('sinon');
const should = require('should');

const sandbox = sinon.sandbox.create();

const getOpts = () => {
  return {
      logger: {
          info: sandbox.spy(),
          error: sandbox.spy()
      },
      inbound: {
          level: 'info'
      },
      sync: true,
      context: ctx => {
          return {
              userId: ctx.request.headers.test_user_id_header,
          };
      },
      bodyKeys: ['skills', 'edu', 'exp', 'loc', 'lastPageFallback'],
      errors: {
          callback: (ctx, error) => {
              ctx.status = error.status || 500;
              let message;

              if (config.env === 'development') {
                  ctx.body = error.stack;
                  return;
              }

              if (ctx.status < 500) {
                  message = error.message;
              } else {
                  message = 'Something’s up. Please try again, or contact support.';
              }
              ctx.body = { error: message };
          }
      },
      health: [
          { path: '/', method: 'GET' },
          { path: '/health', method: 'GET' },
      ],
      outbound: {
          level: 'info',
          enabled: true
      },
      traceHeaderName: 'X-Prisma-ID'
  };
};

it('defaultAdapter should be an object', () => {
    (typeof defaultAdapter === 'object').should.equal(true);
});

it('defaultAdapter.onInboundRequest should pass', () => {
  const ctx = {
    request: {
        headers: {
            test_user_id_header: 'test-user-id'
        },
        method: 'get',
        req: {
            url: '/test'
        }
    },
    originalUrl: '/test'
  };
  const opts = getOpts();
  defaultAdapter.onInboundRequest.call(opts, { ctx });
    opts.logger.info.calledOnce.should.equal(true);
    opts.logger.info.args[0][0].should.eql({
        userId: 'test-user-id',
        protocol: undefined,
        method: 'GET',
        path: '/test',
        query: null,
        metaHeaders: {},
        log_tag: 'inbound_request'
    });
});

it('defaultAdapter.onInboundRequest POST && this.bodyKeys', () => {
  const ctx = {
    request: {
      method: 'POST',
        headers: {
            test_user_id_header: 'test-user-id'
        },
      body: {
        skills: 'ok'
      },
        req: {
            url: '/test'
        }
    },
    originalUrl: '/test',
  };
  const opts = getOpts();
    defaultAdapter.onInboundRequest.call(opts, { ctx });
    opts.logger.info.calledOnce.should.equal(true);
    opts.logger.info.args[0][0].should.eql({
        userId: 'test-user-id',
        protocol: undefined,
        method: 'POST',
        path: '/test',
        query: null,
        metaHeaders: {

        },
        metaBody: {
            'body.skills': 'ok'
        },
        log_tag: 'inbound_request'
    });
});

it('defaultAdapter.onInboundRequest POST && this.bodyKeys no picked keys', () => {
  const ctx = {
    request: {
      method: 'POST',
        headers: {
            test_user_id_header: 'test-user-id'
        },
      body: {
        testKeySomethinfElse: 'ok'
      },
        req: {
            url: '/test'
        }
    },
    originalUrl: '/test'
  };
  const opts = getOpts();
  defaultAdapter.onInboundRequest.call(opts, { ctx });
  console.log(':::',  opts.logger.info.callCount);
    opts.logger.info.calledOnce.should.equal(true);
    opts.logger.info.args[0][0].should.eql({ userId: 'test-user-id',
        protocol: undefined,
        method: 'POST',
        path: '/test',
        query: null,
        metaHeaders: {},
        log_tag: 'inbound_request' }
    );
});

it('defaultAdapter.onInboundRequest POST && this.bodyKeys && bodyKeys exist in body', () => {
  const ctx = {
    request: {
      method: 'post',
        headers: {
            test_user_id_header: 'test-user-id'
        },
        body: {
        testKeyA: true
      },
        req: {
            url: '/test'
        }
    },
    originalUrl: '/test'
  };
  const opts = getOpts();
  defaultAdapter.onInboundRequest.call(opts, { ctx });
    opts.logger.info.calledOnce.should.equal(true);
    opts.logger.info.args[0][0].should.eql({ userId: 'test-user-id',
        protocol: undefined,
        method: 'POST',
        path: '/test',
        query: null,
        metaHeaders: {},
        log_tag: 'inbound_request' }
    );
});

it('defaultAdapter.onInboundRequest health', () => {
  const ctx = {
    request: {
      method: 'GET',
        headers: {
            test_user_id_header: 'test-user-id'
        },
      path: '/health',
      body: {
        testKeyA: true
      },
        req: {
            url: '/test'
        }
    },
    originalUrl: '/health'
  };
  const opts = getOpts();
  defaultAdapter.onInboundRequest.call(opts, { ctx });
    opts.logger.info.calledOnce.should.equal(true);
    opts.logger.info.args[0][0].should.eql(   { userId: 'test-user-id',
        protocol: undefined,
        method: 'GET',
        path: '/test',
        query: null,
        log_tag: 'inbound_request_health' }
    );

});

it('defaultAdapter.onInboundRequest headersRegex', () => {
    const opts = {
        context: () => {
            return {
                test: true,
                bodyKeys: ['testKayA']
            };
        },
        logger: {
            info: sandbox.spy()
        },
        constructor: {
            EVENT: {
                INBOUND_REQUEST_EVENT: 'INBOUND_REQUEST_EVENT'
            }
        },
        bodyKeys: ['testKeyA'],
        headersRegex: new RegExp('XX-.*'),
        serialize: msg => msg,
        inbound: {
            level: 'info'
        },
        sync: true
    };
  const ctx = {
    request: {
      method: 'post',
      body: {
        testKeyA: true
      },
      headers: {
        'XX-something': true,
        other: true
      },
        req: {
            url: '/test'
        }
    },
    originalUrl: '/test'
  };
  defaultAdapter.onInboundRequest.call(opts, { ctx });
  console.log('opts.logger.info.call:', opts.logger.info.callCount);
    opts.logger.info.calledOnce.should.equal(true);
    opts.logger.info.args[0][0].should.eql({ test: true,
        bodyKeys: [ 'testKayA' ],
        protocol: undefined,
        method: 'POST',
        path: '/test',
        query: null,
        metaHeaders: { 'headers.XX-something': true },
        log_tag: 'inbound_request' }
    );
});

it('defaultAdapter.onInboundRequest headersRegex && no matched headers', () => {
  const opts = {
    context: () => {
      return {
        test: true,
        bodyKeys: ['testKayA']
      };
    },
      headers: {
          'XX-something': true,
          other: true
      },
    constructor: {
      EVENT: {
        INBOUND_REQUEST_EVENT: 'INBOUND_REQUEST_EVENT'
      }
    },
    bodyKeys: ['testKeyA'],
    logger: {
      info: sandbox.spy()
    },
    headersRegex: new RegExp('XX-.*'),
    serialize: msg => msg,
    inbound: {
      level: 'info'
    },
      sync: true
  };
  const ctx = {
    request: {
      method: 'post',
      body: {
        testKeyA: true
      },
      headers: {
        other: true
      },
        req: {
           url: '/test'
        }
    },
    originalUrl: '/test'
  };
  defaultAdapter.onInboundRequest.call(opts, { ctx });
    opts.logger.info.calledOnce.should.equal(true);
    opts.logger.info.args[0][0].should.eql({ test: true,
        bodyKeys: [ 'testKayA' ],
        protocol: undefined,
        method: 'POST',
        path: '/test',
        query: null,
        metaHeaders: {},
        log_tag: 'inbound_request' }
    );
});

it('defaultAdapter.onOutboundResponse should pass', () => {
    (typeof defaultAdapter.onOutboundResponse).should.equal('function');
});

it('defaultAdapter.onOutboundResponse should call this.logger.info', () => {
  const ctx = {
    request: {
      method: 'post',
        headers: {
            test_user_id_header: 'test-user-id'
        },
        req: {
          url: '/test'
        }
    },
      req: {
          url: '/test'
      },
    originalUrl: '/test',
    response: {
      status: 200
    }
  };
  const opts = getOpts();
  defaultAdapter.onInboundRequest.call(opts, { ctx });
  defaultAdapter.onOutboundResponse.call(opts, { ctx });
    opts.logger.info.callCount.should.equal(2);
    opts.logger.info.args[0][0].should.eql({ userId: 'test-user-id',
        protocol: undefined,
        method: 'POST',
        path: '/test',
        query: null,
        metaHeaders: {},
        log_tag: 'inbound_request' }
    );
    opts.logger.info.args[1][0].should.eql({ status: undefined,
        duration: NaN,
        userId: 'test-user-id',
        protocol: undefined,
        method: 'POST',
        path: '/test',
        query: null,
        log_tag: 'outbound_response' }
    );
});

it('defaultAdapter.onOutboundResponse health', () => {
  const ctx = {
    request: {
      method: 'GET',
        headers: {
            test_user_id_header: 'test-user-id'
        },
      path: '/health',
        req: {
            url: '/health'
        }
    },
    originalUrl: '/health',
    response: {
      status: 200
    }
  };
  const opts = getOpts();
  defaultAdapter.onInboundRequest.call(opts, { ctx });
  defaultAdapter.onOutboundResponse.call(opts, { ctx });
    opts.logger.info.args[0][0].should.eql({ userId: 'test-user-id',
        protocol: undefined,
        method: 'GET',
        path: '/health',
        query: null,
        log_tag: 'inbound_request_health' }
    );
    opts.logger.info.args[1][0].should.eql({ userId: 'test-user-id',
        protocol: undefined,
        method: 'GET',
        path: '/health',
        query: null,
        log_tag: 'outbound_response_health',
        status: undefined,
        duration: NaN }
    );
});

it('defaultAdapter.onError should pass', () => {
    (typeof defaultAdapter.onError).should.equal('function');
});

it.only('defaultAdapter.onError should call this.logger.error()', () => {
  const ctx = {
    request: {
      method: 'post',
        headers: {
            test_user_id_header: 'test-user-id'
        },
        req: {
            url: '/test'
        }
    },
    originalUrl: '/test',
    response: {
      status: 200
    }
  };
  const err = new Error('something bad');
  const opts = getOpts();
  defaultAdapter.onInboundRequest.call(opts, { ctx });
    opts.logger.info.calledOnce.should.equal(true);
    opts.logger.info.args[0][0].should.eql({ userId: 'test-user-id',
        protocol: undefined,
        method: 'POST',
        path: '/test',
        query: null,
        metaHeaders: {},
        log_tag: 'inbound_request' }
    );
  defaultAdapter.onError.call(opts, { ctx, err });
  console.log('::::', opts.logger.error.callCount);
    opts.logger.error.calledOnce.should.equal(true);
    opts.logger.error.args[0][0].params.should.eql({query: undefined,
        body: undefined,
        log_tag: 'unexpected_error' });
    opts.logger.error.args[0][0].context.should.eql({ userId: 'test-user-id',
        protocol: undefined,
        method: 'POST',
        path: '/test',
        query: null });
    opts.logger.error.args[0][0].message.should.equal('something bad');
});
//
// test('defaultAdapter.requestProxy should default the arg to empty obj', t => {
//   defaultAdapter.requestProxy();
//   t.pass();
// });
//
// test('defaultAdapter.requestProxy should pass when incomingMessage.url exists', t => {
//   const logger = {
//     info: () => {}
//   };
//   const serialize = a => a;
//   const traceHeaderName = 'test';
//   const requestProxy = defaultAdapter.requestProxy({ logger, serialize, traceHeaderName, level: 'info' });
//   const incomingMessage = {
//     method: 'GET',
//     port: '8080',
//     headers: {
//       test: 'ok'
//     },
//     url: {
//       protocol: 'http:',
//       pathname: '/some',
//       query: 'some=something',
//       host: 'some-host'
//     }
//   };
//   const http = {
//     request: () => {
//       return {
//         on: (event, fn) => {
//           fn({
//             statusCode: 200
//           });
//         }
//       };
//     }
//   };
//   http.request = new Proxy(http.request, requestProxy);
//   http.request(incomingMessage);
//   t.pass();
// });
//
// test('defaultAdapter.requestProxy should pass when no protocol', t => {
//   const logger = {
//     info: () => {}
//   };
//   const serialize = a => a;
//   const traceHeaderName = 'test';
//   const requestProxy = defaultAdapter.requestProxy({ logger, serialize, traceHeaderName, level: 'info' });
//   const incomingMessage = {
//     method: 'GET',
//     port: '8080',
//     headers: {
//       test: 'ok'
//     },
//     url: {
//       protocol: undefined,
//       pathname: '/some',
//       query: 'some=something',
//       host: 'some-host'
//     }
//   };
//   const http = {
//     request: () => {
//       return {
//         on: (event, fn) => {
//           fn({
//             statusCode: 200
//           });
//         }
//       };
//     }
//   };
//   http.request = new Proxy(http.request, requestProxy);
//   http.request(incomingMessage);
//   t.pass();
// });
//
// test('defaultAdapter.requestProxy should pass when incomingMessage.url does not exist', t => {
//   const logger = {
//     info: () => {}
//   };
//   const serialize = a => a;
//   const traceHeaderName = 'test';
//   const requestProxy = defaultAdapter.requestProxy({ logger, serialize, traceHeaderName, level: 'info' });
//   const incomingMessage = {
//     method: 'GET',
//     port: '8080',
//     headers: {
//       test: 'ok'
//     },
//     protocol: 'https:',
//     path: '/some?somequery=query',
//     host: 'test-host'
//   };
//   const http = {
//     request: () => {
//       return {
//         on: (event, fn) => {
//           fn({
//             statusCode: 200
//           });
//         }
//       };
//     }
//   };
//   http.request = new Proxy(http.request, requestProxy);
//   http.request(incomingMessage);
//   t.pass();
// });
//
// test('defaultAdapter.requestProxy should pass when requestId does not exist', t => {
//   const logger = {
//     info: () => {}
//   };
//   const serialize = a => a;
//   const traceHeaderName = 'test';
//   const requestProxy = defaultAdapter.requestProxy({ logger, serialize, traceHeaderName, level: 'info' });
//   const incomingMessage = {
//     method: 'GET',
//     port: '8080',
//     headers: {},
//     protocol: 'https:',
//     path: '/some?somequery=query',
//     host: 'test-host'
//   };
//   const http = {
//     request: () => {
//       return {
//         on: (event, fn) => {
//           fn({
//             statusCode: 200
//           });
//         }
//       };
//     }
//   };
//   http.request = new Proxy(http.request, requestProxy);
//   http.request(incomingMessage);
//   t.pass();
// });
//
// test('defaultAdapter.requestProxy should pass when requestId key is not given', t => {
//   const logger = {
//     info: () => {}
//   };
//   const serialize = a => a;
//   const requestProxy = defaultAdapter.requestProxy({ logger, serialize, level: 'info' });
//   const incomingMessage = {
//     method: 'GET',
//     port: '8080',
//     headers: {},
//     protocol: 'https:',
//     path: '/some?somequery=query',
//     host: 'test-host'
//   };
//   const http = {
//     request: () => {
//       return {
//         on: (event, fn) => {
//           fn({
//             statusCode: 200
//           });
//         }
//       };
//     }
//   };
//   http.request = new Proxy(http.request, requestProxy);
//   http.request(incomingMessage);
//   t.pass();
// });
//
// test('defaultAdapter.requestProxy should pass if the proxy throws an error before proxying', t => {
//   const logger = {
//     info: () => {},
//     error: () => {}
//   };
//   const serialize = a => a;
//   const traceHeaderName = 'test';
//   const requestProxy = defaultAdapter.requestProxy({ logger, serialize, traceHeaderName });
//   const incomingMessage = null;
//   const http = {
//     request: () => {
//       return {
//         on: (event, fn) => {
//           fn({
//             statusCode: 200
//           });
//         }
//       };
//     }
//   };
//   http.request = new Proxy(http.request, requestProxy);
//   http.request(incomingMessage);
//   t.pass();
// });
//
// test('defaultAdapter.requestProxy should pass if the proxy throws an error after proxying', t => {
//   const logger = {
//     info: () => {},
//     error: () => {}
//   };
//   const serialize = a => a;
//   const traceHeaderName = 'test';
//   const requestProxy = defaultAdapter.requestProxy({ logger, serialize, traceHeaderName, level: 'info' });
//   const incomingMessage = {
//     method: 'GET',
//     port: '8080',
//     headers: {
//       test: 'ok'
//     },
//     url: {
//       protocol: 'http:',
//       pathname: '/some',
//       query: 'some=something',
//       host: 'some-host'
//     }
//   };
//   const http = {
//     request: () => {
//       return {
//         on: (event, fn) => {
//           fn(null);
//         }
//       };
//     }
//   };
//   http.request = new Proxy(http.request, requestProxy);
//   http.request(incomingMessage);
//   t.pass();
// });
