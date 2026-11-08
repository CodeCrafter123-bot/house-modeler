%{
#include <iostream>
#include <vector>
#include <memory>
#include "ast.h"
#include <string>
#include <cstdlib>

using namespace std;

std::string last_wall;
std::string last_direction;
HouseNode* root = nullptr;
FloorNode* currentFloor = nullptr;
RoomNode* currentRoom = nullptr;

void yyerror(const char* s);
int yylex();
%}

/* ================= TYPE SYSTEM ================= */
%union {
    int ival;
    char* sval;
    void* node;
}

/* ================= TOKENS ================= */
%token HOUSE FLOORS ROOMS DOORS WINDOWS STAIR
%token POSITION DIRECTION HEIGHT WALL COLOR
%token LEFT_RIGHT FRONT_BACK RIGHT_LEFT BACK_FRONT
%token FRONT BACK LEFT RIGHT
%token <ival> NUMBER
%token <sval> COLOR_VALUE

%type <node> coord_pair position

%%

/* ================= PROGRAM ================= */

program:
    HOUSE '{'
        {
            root = new HouseNode();
        }
    floors ';'
    '}'
;

/* ================= FLOORS ================= */

floors:
    FLOORS '[' floor_list ']'
;

floor_list:
    floor
    | floor ',' floor_list
;

floor:
    '{'
        HEIGHT '=' NUMBER ';'
        {
            FloorNode* f = new FloorNode();
            f->height = $4;
            root->floors.push_back(unique_ptr<FloorNode>(f));
            currentFloor = f;
        }
    color_opt
    rooms ';'
    stair_opt
    '}'
;

/* ================= COLOR (optional) ================= */

color_opt:
    COLOR '=' COLOR_VALUE ';'
    {
        currentFloor->color = $3;
        free($3);
    }
    | /* empty */
;

/* ================= ROOMS ================= */

rooms:
    ROOMS '[' room_list ']'
;

room_list:
    room
    | room ',' room_list
;

room:
    '{'
        {
            RoomNode* r = new RoomNode();
            currentFloor->rooms.push_back(unique_ptr<RoomNode>(r));
            currentRoom = r;
        }
    position ';'
        {
            currentRoom->position = *(PositionNode*)$3;
            delete (PositionNode*)$3;
        }
    doors ';'
    windows_opt
    '}'
;

/* ================= POSITION ================= */

position:
    POSITION '=' coord_pair ',' coord_pair
    {
        PositionNode* p = new PositionNode();
        p->a = *(Coord*)$3;
        p->b = *(Coord*)$5;
        delete (Coord*)$3;
        delete (Coord*)$5;
        $$ = p;
    }
;

coord_pair:
    '(' NUMBER ',' NUMBER ')'
    {
        Coord* c = new Coord();
        c->x = $2;
        c->y = $4;
        $$ = c;
    }
;

/* ================= DOORS ================= */

doors:
    DOORS '[' door_list ']'
;

door_list:
    door
    | door ',' door_list
;

door:
    '{' wall ';' '}'
    {
        DoorNode* d = new DoorNode();
        d->wall = make_unique<WallNode>();
        d->wall->value = last_wall;
        currentRoom->doors.push_back(unique_ptr<DoorNode>(d));
    }
;

/* ================= WINDOWS ================= */

windows_opt:
    windows ';'
    | /* empty */
;

windows:
    WINDOWS '[' window_list ']'
;

window_list:
    window
    | window ',' window_list
;

window:
    '{' wall ';' '}'
    {
        WindowNode* w = new WindowNode();
        w->wall = make_unique<WallNode>();
        w->wall->value = last_wall;
        currentRoom->windows.push_back(unique_ptr<WindowNode>(w));
    }
;

/* ================= WALL ================= */

wall:
    WALL '=' wall_values
;

wall_values:
    FRONT  { last_wall = "FRONT"; }
  | BACK   { last_wall = "BACK"; }
  | LEFT   { last_wall = "LEFT"; }
  | RIGHT  { last_wall = "RIGHT"; }
;

/* ================= STAIR ================= */

stair_opt:
    STAIR '{' position ';' direction ';' '}'
    {
        StairNode* s = new StairNode();
        s->position = *(PositionNode*)$3;
        delete (PositionNode*)$3; 

        s->direction = last_direction;
        currentFloor->stair = unique_ptr<StairNode>(s);
    }| /* empty */
    
;

direction:
    DIRECTION '=' LEFT_RIGHT   { last_direction = "LEFT_RIGHT"; }
  | DIRECTION '=' FRONT_BACK  { last_direction = "FRONT_BACK"; }
  | DIRECTION '=' RIGHT_LEFT  { last_direction = "RIGHT_LEFT"; }
  | DIRECTION '=' BACK_FRONT  { last_direction = "BACK_FRONT"; }
;

%%
