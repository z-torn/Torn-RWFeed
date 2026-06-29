// src/controller/ApiController.hpp
#pragma once

#include "oatpp/core/macro/codegen.hpp"
#include "oatpp/parser/json/mapping/ObjectMapper.hpp"
#include "oatpp/web/server/api/ApiController.hpp"

#include OATPP_CODEGEN_BEGIN(ApiController)

class ApiController : public oatpp::web::server::api::ApiController {
  using __ControllerType = ApiController; // Required for 'controller->' pointer access in async blocks

public:
  ApiController(const std::shared_ptr<ObjectMapper>& objectMapper)
      : oatpp::web::server::api::ApiController(objectMapper) {}

  static std::shared_ptr<ApiController> createShared(
      OATPP_COMPONENT(std::shared_ptr<ObjectMapper>, objectMapper)) {
    return std::make_shared<ApiController>(objectMapper);
  }

  // 1. Asynchronous handler for web browsers (GET)
  ENDPOINT_INFO(Root) {
    info->summary = "Root endpoint - health check";
    info->addResponse<String>(Status::CODE_200, "text/plain");
  }
  ENDPOINT_ASYNC("GET", "/", Root) {
    ENDPOINT_ASYNC_INIT(Root)
    Action act() override {
      auto response = controller->createResponse(Status::CODE_200, "Torn RW Feed Server is Online!");
      response->putHeader("Content-Type", "text/plain");
      return _return(response);
    }
  };

  // 2. Asynchronous handler for UptimeRobot's free tier (HEAD)
  ENDPOINT_INFO(RootHead) {
    info->summary = "Root endpoint - UptimeRobot HEAD check";
    info->addResponse<String>(Status::CODE_200, "text/plain");
  }
  ENDPOINT_ASYNC("HEAD", "/", RootHead) {
    ENDPOINT_ASYNC_INIT(RootHead)
    Action act() override {
      auto response = controller->createResponse(Status::CODE_200, ""); // HEAD must have empty body
      response->putHeader("Content-Type", "text/plain");
      return _return(response);
    }
  };
};

#include OATPP_CODEGEN_END(ApiController)