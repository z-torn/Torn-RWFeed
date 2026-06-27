// src/controller/ApiController.hpp
#pragma once

#include "oatpp/core/macro/codegen.hpp"
#include "oatpp/parser/json/mapping/ObjectMapper.hpp"
#include "oatpp/web/server/api/ApiController.hpp"

#include OATPP_CODEGEN_BEGIN(ApiController)

class ApiController : public oatpp::web::server::api::ApiController {
  using __ControllerType = ApiController;

public:
  ApiController(const std::shared_ptr<ObjectMapper>& objectMapper)
      : oatpp::web::server::api::ApiController(objectMapper) {}

  static std::shared_ptr<ApiController> createShared(
      OATPP_COMPONENT(std::shared_ptr<ObjectMapper>, objectMapper)) {
    return std::make_shared<ApiController>(objectMapper);
  }

  ENDPOINT_INFO(root) {
    info->summary = "Root endpoint - health check";
    info->addResponse<String>(Status::CODE_200, "text/plain");
  }

  ENDPOINT("GET", "/", root) {
    auto response = createResponse(Status::CODE_200, "Torn RW Feed Server is Online!");
    response->putHeader("Content-Type", "text/plain");
    return response;
  }
};

#include OATPP_CODEGEN_END(ApiController)