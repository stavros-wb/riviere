const defaultAdapter = require('../../../../lib/adapters/default');

const sinon = require('sinon');
const should = require('should');

const sandbox = sinon.sandbox.create();

const getOpts = require('../../../../fixtures/getOpts');

const uuid = '9b4f5d20-7a31-468a-b0f8-298013cbe940';

describe('#defaultAdapter', () => {
  describe('.onOutboundResponse()', () => {
    it('should pass', () => {
      (typeof defaultAdapter.onOutboundResponse).should.equal('function');
    });

    it('should call this.logger.info', () => {
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
          url: '/test',
          headers: {
            'x-ap-id': uuid
          }
        },
        originalUrl: '/test',
        response: {
          status: 200
        }
      };
      const opts = getOpts(sandbox);
      defaultAdapter.onInboundRequest.call(opts, { ctx });
      defaultAdapter.onOutboundResponse.call(opts, { ctx });
      opts.logger.info.callCount.should.equal(2);
      opts.logger.info.args[0][0].should.eql({
        userId: 'test-user-id',
        protocol: undefined,
        method: 'POST',
        path: '/test',
        query: null,
        requestId: uuid,
        log_tag: 'inbound_request'
      });
      opts.logger.info.args[1][0].should.eql({
        status: undefined,
        duration: NaN,
        userId: 'test-user-id',
        protocol: undefined,
        method: 'POST',
        path: '/test',
        query: null,
        requestId: uuid,
        log_tag: 'outbound_response'
      });
    });

    it('should handle health endpoint', () => {
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
        req: {
          headers: {
            'x-ap-id': uuid
          }
        },
        originalUrl: '/health',
        response: {
          status: 200
        }
      };
      const opts = getOpts(sandbox);
      defaultAdapter.onInboundRequest.call(opts, { ctx });
      defaultAdapter.onOutboundResponse.call(opts, { ctx });
      opts.logger.info.args[0][0].should.eql({
        userId: 'test-user-id',
        protocol: undefined,
        method: 'GET',
        path: '/health',
        query: null,
        requestId: uuid,
        log_tag: 'inbound_request_health'
      });
      opts.logger.info.args[1][0].should.eql({
        userId: 'test-user-id',
        protocol: undefined,
        method: 'GET',
        path: '/health',
        query: null,
        log_tag: 'outbound_response_health',
        status: undefined,
        requestId: uuid,
        duration: NaN
      });
    });
  });
});
