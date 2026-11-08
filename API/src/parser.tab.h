/* A Bison parser, made by GNU Bison 3.8.2.  */

/* Bison interface for Yacc-like parsers in C

   Copyright (C) 1984, 1989-1990, 2000-2015, 2018-2021 Free Software Foundation,
   Inc.

   This program is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this program.  If not, see <https://www.gnu.org/licenses/>.  */

/* As a special exception, you may create a larger work that contains
   part or all of the Bison parser skeleton and distribute that work
   under terms of your choice, so long as that work isn't itself a
   parser generator using the skeleton or a modified version thereof
   as a parser skeleton.  Alternatively, if you modify or redistribute
   the parser skeleton itself, you may (at your option) remove this
   special exception, which will cause the skeleton and the resulting
   Bison output files to be licensed under the GNU General Public
   License without this special exception.

   This special exception was added by the Free Software Foundation in
   version 2.2 of Bison.  */

/* DO NOT RELY ON FEATURES THAT ARE NOT DOCUMENTED in the manual,
   especially those whose name start with YY_ or yy_.  They are
   private implementation details that can be changed or removed.  */

#ifndef YY_YY_PARSER_TAB_H_INCLUDED
# define YY_YY_PARSER_TAB_H_INCLUDED
/* Debug traces.  */
#ifndef YYDEBUG
# define YYDEBUG 0
#endif
#if YYDEBUG
extern int yydebug;
#endif

/* Token kinds.  */
#ifndef YYTOKENTYPE
# define YYTOKENTYPE
  enum yytokentype
  {
    YYEMPTY = -2,
    YYEOF = 0,                     /* "end of file"  */
    YYerror = 256,                 /* error  */
    YYUNDEF = 257,                 /* "invalid token"  */
    HOUSE = 258,                   /* HOUSE  */
    FLOORS = 259,                  /* FLOORS  */
    ROOMS = 260,                   /* ROOMS  */
    DOORS = 261,                   /* DOORS  */
    WINDOWS = 262,                 /* WINDOWS  */
    STAIR = 263,                   /* STAIR  */
    POSITION = 264,                /* POSITION  */
    DIRECTION = 265,               /* DIRECTION  */
    HEIGHT = 266,                  /* HEIGHT  */
    WALL = 267,                    /* WALL  */
    COLOR = 268,                   /* COLOR  */
    LEFT_RIGHT = 269,              /* LEFT_RIGHT  */
    FRONT_BACK = 270,              /* FRONT_BACK  */
    RIGHT_LEFT = 271,              /* RIGHT_LEFT  */
    BACK_FRONT = 272,              /* BACK_FRONT  */
    FRONT = 273,                   /* FRONT  */
    BACK = 274,                    /* BACK  */
    LEFT = 275,                    /* LEFT  */
    RIGHT = 276,                   /* RIGHT  */
    NUMBER = 277,                  /* NUMBER  */
    COLOR_VALUE = 278              /* COLOR_VALUE  */
  };
  typedef enum yytokentype yytoken_kind_t;
#endif

/* Value type.  */
#if ! defined YYSTYPE && ! defined YYSTYPE_IS_DECLARED
union YYSTYPE
{
#line 22 "parser.y"

    int ival;
    char* sval;
    void* node;

#line 93 "parser.tab.h"

};
typedef union YYSTYPE YYSTYPE;
# define YYSTYPE_IS_TRIVIAL 1
# define YYSTYPE_IS_DECLARED 1
#endif


extern YYSTYPE yylval;


int yyparse (void);


#endif /* !YY_YY_PARSER_TAB_H_INCLUDED  */
