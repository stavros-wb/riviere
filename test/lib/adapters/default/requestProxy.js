const defaultAdapter = require('../../../../lib/adapters/default');

const sinon = require('sinon');
const should = require('should');

const sandbox = sinon.sandbox.create();

sinon.useFakeTimers(new Date(2011, 9, 1).getTime());

describe('#defaultAdapter', () => {
  describe('.requestProxy()', () => {
    it('should pass', () => {
      defaultAdapter.requestProxy();
    });

    it('should pass when incomingMessage.url exists', () => {
      const logger = {
        info: sandbox.spy()
      };
      const serialize = a => a;
      const traceHeaderName = 'test';
      const requestProxy = defaultAdapter.requestProxy({ logger, serialize, traceHeaderName, level: 'info' });
      const incomingMessage = {
        method: 'GET',
        port: '8080',
        headers: {
          test: 'ok'
        },
        url: {
          protocol: 'http:',
          pathname: '/some',
          query: 'some=something',
          host: 'some-host'
        }
      };
      const http = {
        request: () => {
          return {
            on: (event, fn) => {
              fn({
                statusCode: 200
              });
            }
          };
        }
      };
      const httpRequest = () => {
        return {
          on: (on, cb) => {
            const res = {};
            cb(res);
            logger.info.callCount.should.equal(2);
            logger.info.args[0][0].should.eql({
              method: 'GET',
              protocol: 'http',
              port: '8080',
              path: '/some',
              query: 'some=something',
              requestId: 'ok',
              href: undefined,
              host: 'some-host',
              log_tag: 'outbound_request'
            });
            logger.info.args[1][0].should.eql({
              method: 'GET',
              path: '/some',
              host: 'some-host',
              duration: 0,
              query: 'some=something',
              status: undefined,
              protocol: 'http',
              requestId: 'ok',
              log_tag: 'inbound_response'
            });
          }
        };
      };
      http.request = new Proxy(httpRequest, requestProxy);
      http.request(incomingMessage);
      logger.info.callCount.should.eql(2);
    });

    it('should pass when no protocol', () => {
      const logger = {
        info: sandbox.spy()
      };
      const serialize = a => a;
      const traceHeaderName = 'test';
      const requestProxy = defaultAdapter.requestProxy({ logger, serialize, traceHeaderName, level: 'info' });
      const incomingMessage = {
        method: 'GET',
        port: '8080',
        headers: {
          test: 'ok'
        },
        url: {
          protocol: undefined,
          pathname: '/some',
          query: 'some=something',
          host: 'some-host'
        }
      };
      const http = {
        request: function() {
          return {
            on: (event, fn) => {
              fn({
                statusCode: 200
              });
            }
          };
        }
      };
      const httpRequest = function() {
        arguments[0].should.eql({
          method: 'GET',
          port: '8080',
          headers: { test: 'ok' },
          url: {
            protocol: undefined,
            pathname: '/some',
            query: 'some=something',
            host: 'some-host'
          }
        });
        return {
          on: () => {
            throw new Error('should not be called');
          }
        };
      };
      http.request = new Proxy(httpRequest, requestProxy);
      http.request(incomingMessage);
      logger.info.callCount.should.eql(0);
    });

    it('should pass when incomingMessage.url does not exist', () => {
      const logger = {
        info: sandbox.spy()
      };
      const serialize = a => a;
      const traceHeaderName = 'test';
      const requestProxy = defaultAdapter.requestProxy({ logger, serialize, traceHeaderName, level: 'info' });
      const incomingMessage = {
        method: 'GET',
        port: '8080',
        headers: {
          test: 'ok'
        },
        protocol: 'https:',
        path: '/some?somequery=query',
        host: 'test-host'
      };
      const http = {
        request: () => {
          return {
            on: (event, fn) => {
              fn({
                statusCode: 200
              });
            }
          };
        }
      };
      http.request = new Proxy(http.request, requestProxy);
      http.request(incomingMessage);
      logger.info.callCount.should.eql(2);
      logger.info.args[0][0].should.eql({
        method: 'GET',
        port: '8080',
        path: '/some?somequery=query',
        query: undefined,
        requestId: 'ok',
        host: undefined,
        protocol: 'https',
        href: undefined,
        log_tag: 'outbound_request'
      });
      logger.info.args[1][0].should.eql({
        method: 'GET',
        path: '/some?somequery=query',
        status: 200,
        host: undefined,
        protocol: 'https',
        duration: 0,
        query: undefined,
        requestId: 'ok',
        log_tag: 'inbound_response'
      });
    });

    it('should pass when requestId is not given', () => {
      const logger = {
        info: sandbox.spy()
      };
      const serialize = a => a;
      const traceHeaderName = 'test';
      const requestProxy = defaultAdapter.requestProxy({ logger, serialize, traceHeaderName, level: 'info' });
      const incomingMessage = {
        method: 'GET',
        port: '8080',
        headers: {},
        protocol: 'https:',
        path: '/some?somequery=query',
        host: 'test-host'
      };
      const http = {
        request: () => {
          return {
            on: (event, fn) => {
              fn({
                statusCode: 200
              });
            }
          };
        }
      };
      http.request = new Proxy(http.request, requestProxy);
      http.request(incomingMessage);
      logger.info.callCount.should.eql(2);
      logger.info.args[0][0].should.containEql({
        method: 'GET',
        protocol: 'https',
        host: undefined,
        port: '8080',
        path: '/some?somequery=query',
        query: undefined,
        href: undefined,
        log_tag: 'outbound_request'
      });
      logger.info.args[1][0].should.containEql({
        method: 'GET',
        host: undefined,
        path: '/some?somequery=query',
        status: 200,
        duration: 0,
        query: undefined,
        protocol: 'https',
        log_tag: 'inbound_response'
      });
    });

    it('should pass when requestId does not exist', () => {
      const logger = {
        info: sandbox.spy()
      };
      const serialize = a => a;
      const traceHeaderName = 'test';
      const requestProxy = defaultAdapter.requestProxy({ logger, serialize, traceHeaderName, level: 'info' });
      const incomingMessage = {
        method: 'GET',
        port: '8080',
        headers: {
          [traceHeaderName]: 'cff07fc2-4ef6-42b6-9a74-ba3abf8b31a2'
        },
        protocol: 'https:',
        path: '/some?somequery=query',
        host: 'test-host'
      };
      const http = {
        request: () => {
          return {
            on: (event, fn) => {
              fn({
                statusCode: 200
              });
            }
          };
        }
      };
      http.request = new Proxy(http.request, requestProxy);
      http.request(incomingMessage);
      logger.info.callCount.should.eql(2);
      logger.info.args[0][0].should.eql({
        method: 'GET',
        protocol: 'https',
        host: undefined,
        port: '8080',
        path: '/some?somequery=query',
        query: undefined,
        href: undefined,
        requestId: 'cff07fc2-4ef6-42b6-9a74-ba3abf8b31a2',
        log_tag: 'outbound_request'
      });
      logger.info.args[1][0].should.eql({
        method: 'GET',
        host: undefined,
        path: '/some?somequery=query',
        status: 200,
        duration: 0,
        query: undefined,
        protocol: 'https',
        requestId: 'cff07fc2-4ef6-42b6-9a74-ba3abf8b31a2',
        log_tag: 'inbound_response'
      });
    });

    it('should pass when requestId key is not given', () => {
      const logger = {
        info: sandbox.spy()
      };
      const serialize = a => a;
      const traceHeaderName = 'test';
      const requestProxy = defaultAdapter.requestProxy({ logger, traceHeaderName, serialize, level: 'info' });
      const incomingMessage = {
        method: 'GET',
        port: '8080',
        headers: {
          [traceHeaderName]: 'cff07fc2-4ef6-42b6-9a74-ba3abf8b31a2'
        },
        protocol: 'https:',
        path: '/some?somequery=query',
        host: 'test-host'
      };
      const http = {
        request: () => {
          return {
            on: (event, fn) => {
              fn({
                statusCode: 200
              });
            }
          };
        }
      };
      http.request = new Proxy(http.request, requestProxy);
      http.request(incomingMessage);
      logger.info.callCount.should.eql(2);
      logger.info.args[0][0].should.eql({
        method: 'GET',
        protocol: 'https',
        host: undefined,
        port: '8080',
        path: '/some?somequery=query',
        query: undefined,
        href: undefined,
        requestId: 'cff07fc2-4ef6-42b6-9a74-ba3abf8b31a2',
        log_tag: 'outbound_request'
      });
      logger.info.args[1][0].should.eql({
        method: 'GET',
        path: '/some?somequery=query',
        status: 200,
        duration: 0,
        host: undefined,
        query: undefined,
        protocol: 'https',
        requestId: 'cff07fc2-4ef6-42b6-9a74-ba3abf8b31a2',
        log_tag: 'inbound_response'
      });
    });

    it('should pass if the proxy throws an error before proxying', () => {
      const logger = {
        info: sandbox.spy(),
        error: sandbox.spy()
      };
      const serialize = a => a;
      const traceHeaderName = 'test';
      const requestProxy = defaultAdapter.requestProxy({ logger, serialize, traceHeaderName });
      const incomingMessage = null;
      const http = {
        request: () => {
          return {
            on: () => {
              throw new Error('should not throw');
            }
          };
        }
      };
      http.request = new Proxy(http.request, requestProxy);
      http.request(incomingMessage);
      logger.info.callCount.should.eql(0);
    });

    it('should pass if the proxy throws an error after proxying', () => {
      const logger = {
        info: sandbox.spy(),
        error: sandbox.spy()
      };
      const serialize = a => a;
      const traceHeaderName = 'test';
      const requestProxy = defaultAdapter.requestProxy({ logger, serialize, traceHeaderName, level: 'info' });
      const incomingMessage = {
        method: 'GET',
        port: '8080',
        headers: {
          test: 'ok'
        },
        url: {
          protocol: 'http:',
          pathname: '/some',
          query: 'some=something',
          host: 'some-host'
        }
      };
      const http = {
        request: () => {
          return {
            on: (event, fn) => {
              fn(null);
            }
          };
        }
      };
      http.request = new Proxy(http.request, requestProxy);
      http.request(incomingMessage);
      logger.info.callCount.should.eql(1);
      logger.info.args[0][0].should.eql({
        method: 'GET',
        protocol: 'http',
        host: 'some-host',
        href: undefined,
        port: '8080',
        path: '/some',
        query: 'some=something',
        requestId: 'ok',
        log_tag: 'outbound_request'
      });
    });

    it('should not throw if the request has no headers', () => {
      const logger = {
        info: sandbox.spy()
      };
      const serialize = a => a;
      const traceHeaderName = 'test';
      const requestProxy = defaultAdapter.requestProxy({ logger, serialize, traceHeaderName, level: 'info' });
      const http = {
        request: () => {
          return {
            on: (event, fn) => {
              fn({
                statusCode: 200
              });
            }
          };
        }
      };
      const incomingMessage = {
        method: 'GET',
        port: '8080',
        url: {
          protocol: 'http:',
          pathname: '/some',
          query: 'some=something',
          host: 'some-host'
        }
      };
      const httpRequest = () => {
        return {
          on: (on, cb) => {
            const res = {};
            cb(res);
            logger.info.callCount.should.equal(2);
            logger.info.args[0][0].should.containEql({
              method: 'GET',
              protocol: 'http',
              port: '8080',
              path: '/some',
              query: 'some=something',
              href: undefined,
              host: 'some-host',
              log_tag: 'outbound_request'
            });
            logger.info.args[1][0].should.containEql({
              method: 'GET',
              path: '/some',
              host: 'some-host',
              duration: 0,
              query: 'some=something',
              status: undefined,
              protocol: 'http',
              log_tag: 'inbound_response'
            });
          }
        };
      };
      http.request = new Proxy(httpRequest, requestProxy);
      http.request(incomingMessage);
    });
  });
});
