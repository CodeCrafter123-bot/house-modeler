%{
#include "parser.tab.h"
#include <cstdlib>
#include <string>
#include <cstring>
#include <cctype>

// Copy the matched text in lowercase so "Red", "RED" and "red" all mean the same color.
static char* lowerCopy(const char* text) {
    char* out = strdup(text);
    for (char* c = out; *c; ++c) *c = (char)tolower((unsigned char)*c);
    return out;
}
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
"COLOR"                     return COLOR;

"LEFT_RIGHT"                return LEFT_RIGHT;
"FRONT_BACK"                return FRONT_BACK;
"RIGHT_LEFT"                return RIGHT_LEFT;
"BACK_FRONT"                return BACK_FRONT;

"FRONT"                     return FRONT;
"BACK"                      return BACK;
"LEFT"                      return LEFT;
"RIGHT"                     return RIGHT;

"RED"|"BLUE"|"GREEN"|"YELLOW"|"ORANGE"|"PURPLE"|"PINK"|"BROWN"|"WHITE"|"BLACK"|"GRAY"|"GREY"|"BEIGE" {
    yylval.sval = lowerCopy(yytext);
    return COLOR_VALUE;
}

"#"[0-9A-F]{6} {
    yylval.sval = lowerCopy(yytext);
    return COLOR_VALUE;
}

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