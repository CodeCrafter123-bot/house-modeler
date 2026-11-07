%{
#include "parser.tab.h"
#include <cstdlib>
#include <string>
%}

%option yylineno
%option noyywrap
%option caseless

%%

"//".*                      ;   // comments

"HOUSE"                     return HOUSE;
"FLOORS"                    return FLOORS;
"ROOMS"                     return ROOMS;
"DOORS"                     return DOORS;
"WINDOWS"                   return WINDOWS;
"STAIR"                     return STAIR;

"POSITION"                  return POSITION;
"DIRECTION"                 return DIRECTION;
"HEIGHT"                    return HEIGHT;
"WALL"                      return WALL;

"LEFT_RIGHT"                return LEFT_RIGHT;
"FRONT_BACK"                return FRONT_BACK;
"RIGHT_LEFT"                return RIGHT_LEFT;
"BACK_FRONT"                return BACK_FRONT;

"FRONT"                     return FRONT;
"BACK"                      return BACK;
"LEFT"                      return LEFT;
"RIGHT"                     return RIGHT;

[0-9]+ {
    yylval.ival = atoi(yytext);
    return NUMBER;
}

"{"                         return '{';
"}"                         return '}';
"["                         return '[';
"]"                         return ']';
","                         return ',';
";"                         return ';';
"="                         return '=';
"("                         return '(';
")"                         return ')';

[ \t\r\n]+                  ;   // ignore whitespace

.                           return yytext[0];

%%