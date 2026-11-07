#define CROW_ENABLE_ASIO_STANDALONE
#include "crow_all.h"
#include <iostream>
#include <cstdio>
#include <string>
#include "json.hpp"
#include <windows.h>

#include "ast.h"
#include "ast_to_json.h"
#include "ast_debug.h"
#include "semantic_analysis.h"

using namespace std;
using namespace crow;

std::string global_error_message;

#include "parser.tab.h"

extern int yylineno;
extern char* yytext;

typedef struct yy_buffer_state* YY_BUFFER_STATE;
YY_BUFFER_STATE yy_scan_string(const char*);
void yy_delete_buffer(YY_BUFFER_STATE);

int yyparse();
int yylex();

// Custom error handling function for the parser
void yyerror(const char* s) {
	char buf[512];
	snprintf(buf, sizeof(buf),
		"Error at line %d: %s near '%s'",
		yylineno, s, yytext);

	global_error_message = buf;
}

//Get the ast built by the parser
extern HouseNode* root;

//Takes input,applies parsing, semantic analysis, and returns either an error message or the JSON representation of the house model
string parse_input(const string& input) {
	global_error_message = "";
	yylineno = 1;
	root = nullptr;

	YY_BUFFER_STATE buffer = yy_scan_string(input.c_str());
	int result = yyparse();
	yy_delete_buffer(buffer);

	if (result != 0 || root == nullptr) {
		return "{\"status\": \"error\", \"message\": \"" +
			global_error_message + "\"}";
	}

	std::string semanticError;
	if (!SemanticAnalyzer::validateHouse(root, semanticError)) {
		return "{\"status\": \"error\", \"message\": \"" +
			semanticError + "\"}";
	}

	printDerivationTree(root);

	nlohmann::json j = houseToJson(root);
	return j.dump(2);
}

//Main contains the API server setup and request handling logic
int main() {
	SetConsoleOutputCP(CP_UTF8);
	SetConsoleCP(CP_UTF8);

	SimpleApp app;

	CROW_ROUTE(app, "/Compile").methods("POST"_method)
		([&](const request& req) {
		string output = parse_input(req.body);

		response res(output);
		res.add_header("Content-Type", "application/json");
		return res;
			});

	cout << "House Modeler API Server running on port 18080..." << endl;
	app.port(18080).multithreaded().run();
}