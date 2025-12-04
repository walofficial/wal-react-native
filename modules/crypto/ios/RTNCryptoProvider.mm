#import "RTNCryptoProvider.h"
#import <ReactCommon/CallInvoker.h>
#import <ReactCommon/TurboModule.h>
#import "RTNCrypto.h"

@implementation RTNCryptoProvider

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::RTNCrypto>(params.jsInvoker);
}

@end







