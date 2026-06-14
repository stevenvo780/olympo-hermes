#!/bin/bash
# Validación Paralela para Graf

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMP_DIR="/tmp/graf-validate-$$"
mkdir -p "$TEMP_DIR"

SKIP_BUILD=false
SKIP_LINT=false  
SKIP_TESTS=false

for arg in "$@"; do
    case $arg in
        --skip-tests) SKIP_TESTS=true ;;
        --skip-build) SKIP_BUILD=true ;;
        --skip-lint) SKIP_LINT=true ;;
    esac
done

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  🚀 VALIDACIÓN PARALELA DE GRAF${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Función para extraer cobertura de Vitest (graf-admin, graf-client)
extract_vitest_coverage() {
    local output="$1"
    local project_dir="$2"
    
    # Buscar línea "All files" en el output de vitest coverage
    local coverage_line=$(echo "$output" | grep -E "All files\s*\|" | head -1)
    if [ -n "$coverage_line" ]; then
        # Extraer los porcentajes: Stmts, Branch, Funcs, Lines
        echo "$coverage_line" | sed 's/.*All files[[:space:]]*|//' | awk -F'|' '{
            gsub(/[[:space:]]/, "", $1); gsub(/[[:space:]]/, "", $2); 
            gsub(/[[:space:]]/, "", $3); gsub(/[[:space:]]/, "", $4);
            printf "%s %s %s %s", $1, $2, $3, $4
        }'
    else
        # Intentar leer desde coverage-summary.json primero, luego lcov.info
        local json_file="$project_dir/coverage/coverage-summary.json"
        local lcov_file="$project_dir/coverage/lcov.info"
        if [ -f "$json_file" ]; then
            extract_coverage_from_json "$json_file"
        elif [ -f "$lcov_file" ]; then
            extract_coverage_from_lcov "$lcov_file"
        else
            echo "- - - -"
        fi
    fi
}

# Función para extraer cobertura de Jest (graf-backend)
extract_jest_coverage() {
    local output="$1"
    local project_dir="$2"
    
    # Buscar línea "All files" en el output de jest coverage
    local coverage_line=$(echo "$output" | grep -E "All files\s*\|" | head -1)
    if [ -n "$coverage_line" ]; then
        echo "$coverage_line" | sed 's/.*All files[[:space:]]*|//' | awk -F'|' '{
            gsub(/[[:space:]]/, "", $1); gsub(/[[:space:]]/, "", $2); 
            gsub(/[[:space:]]/, "", $3); gsub(/[[:space:]]/, "", $4);
            printf "%s %s %s %s", $1, $2, $3, $4
        }'
    else
        # Intentar leer desde coverage-summary.json primero, luego lcov.info
        local json_file="$project_dir/coverage/coverage-summary.json"
        local lcov_file="$project_dir/coverage/lcov.info"
        if [ -f "$json_file" ]; then
            extract_coverage_from_json "$json_file"
        elif [ -f "$lcov_file" ]; then
            extract_coverage_from_lcov "$lcov_file"
        else
            echo "- - - -"
        fi
    fi
}

# Función para extraer cobertura del archivo coverage-summary.json
extract_coverage_from_json() {
    local json_file="$1"
    if [ -f "$json_file" ]; then
        # Extraer porcentajes del JSON usando grep/sed (sin jq)
        local stmts=$(grep -o '"statements"[^}]*"pct"[[:space:]]*:[[:space:]]*[0-9.]*' "$json_file" | head -1 | grep -oE '[0-9.]+$')
        local branch=$(grep -o '"branches"[^}]*"pct"[[:space:]]*:[[:space:]]*[0-9.]*' "$json_file" | head -1 | grep -oE '[0-9.]+$')
        local funcs=$(grep -o '"functions"[^}]*"pct"[[:space:]]*:[[:space:]]*[0-9.]*' "$json_file" | head -1 | grep -oE '[0-9.]+$')
        local lines=$(grep -o '"lines"[^}]*"pct"[[:space:]]*:[[:space:]]*[0-9.]*' "$json_file" | head -1 | grep -oE '[0-9.]+$')
        
        if [ -n "$stmts" ]; then
            printf "%.2f %.2f %.2f %.2f" "$stmts" "$branch" "$funcs" "$lines"
        else
            echo "- - - -"
        fi
    else
        echo "- - - -"
    fi
}

# Función para extraer cobertura del archivo lcov.info
extract_coverage_from_lcov() {
    local lcov_file="$1"
    if [ -f "$lcov_file" ]; then
        # Contar líneas ejecutadas y totales
        local lines_found=$(grep -c "^DA:" "$lcov_file" 2>/dev/null || echo "0")
        local lines_hit=$(grep "^DA:" "$lcov_file" 2>/dev/null | grep -v ",0$" | wc -l || echo "0")
        
        # Contar funciones
        local funcs_found=$(grep -c "^FN:" "$lcov_file" 2>/dev/null || echo "0")
        local funcs_hit=$(grep "^FNDA:" "$lcov_file" 2>/dev/null | grep -v ",0$" | wc -l || echo "0")
        
        # Contar branches
        local branch_found=$(grep -c "^BRDA:" "$lcov_file" 2>/dev/null || echo "0")
        local branch_hit=$(grep "^BRDA:" "$lcov_file" 2>/dev/null | grep -v ",-$" | grep -v ",0$" | wc -l || echo "0")
        
        if [ "$lines_found" -gt 0 ] 2>/dev/null; then
            local lines_pct=$(awk "BEGIN {printf \"%.2f\", ($lines_hit / $lines_found) * 100}")
            local stmts_pct=$lines_pct  # Aproximación: statements ≈ lines
            local funcs_pct="0"
            local branch_pct="0"
            
            [ "$funcs_found" -gt 0 ] 2>/dev/null && funcs_pct=$(awk "BEGIN {printf \"%.2f\", ($funcs_hit / $funcs_found) * 100}")
            [ "$branch_found" -gt 0 ] 2>/dev/null && branch_pct=$(awk "BEGIN {printf \"%.2f\", ($branch_hit / $branch_found) * 100}")
            
            printf "%s %s %s %s" "$stmts_pct" "$branch_pct" "$funcs_pct" "$lines_pct"
        else
            echo "- - - -"
        fi
    else
        echo "- - - -"
    fi
}

# Función para extraer resumen de tests
extract_test_summary() {
    local output="$1"
    local project_type="$2"
    
    if [ "$project_type" = "jest" ]; then
        # Jest: "Tests: X passed, Y total" o "Tests: X failed, Y passed, Z total"
        local summary=$(echo "$output" | grep -oE "Tests:[^$]+" | tail -1 | sed 's/Tests:[[:space:]]*//' | sed 's/[[:space:]]\+/ /g' | xargs)
        if [ -n "$summary" ]; then
            echo "$summary"
        fi
    else
        # Vitest: "Tests X passed (Y)" o similar
        local passed=$(echo "$output" | grep -oE "[0-9]+ passed" | tail -1 | grep -oE "[0-9]+")
        local failed=$(echo "$output" | grep -oE "[0-9]+ failed" | tail -1 | grep -oE "[0-9]+")
        if [ -n "$passed" ] || [ -n "$failed" ]; then
            [ -z "$passed" ] && passed=0
            [ -z "$failed" ] && failed=0
            local total=$((passed + failed))
            if [ "$failed" -gt 0 ]; then
                echo "${passed}/${total} passed, ${failed} failed"
            else
                echo "${passed}/${total} passed"
            fi
        fi
    fi
}

# Función para contar warnings de lint
count_lint_warnings() {
    local output="$1"
    local sanitized=$(echo "$output" | grep -v "No ESLint warnings or errors")
    # Buscar el resumen final de ESLint (ej: "3 warnings")
    local final_count=$(echo "$sanitized" | grep -oE "[0-9]+ warnings?" | tail -1 | grep -oE "[0-9]+" | head -1)
    if [ -n "$final_count" ]; then
        echo "$final_count"
    else
        # Contar líneas individuales con "warning"
        local warnings=$(echo "$sanitized" | grep -c "warning" 2>/dev/null || echo "0")
        echo "$warnings"
    fi
}

# Lanzar cada proyecto
for project in graf-admin graf-backend graf-client; do
    (
        cd "$ROOT_DIR/$project"
        echo "running" > "$TEMP_DIR/${project}.status"

        b="skip"; l="skip"; t="skip"
        lint_warnings=0
        coverage="- - - -"
        if [ "$project" = "graf-client" ]; then
            export NEXT_OUTPUT_TRACING_ROOT="$ROOT_DIR"
        fi

        # Build
        [ "$SKIP_BUILD" = false ] && { npm run build >/dev/null 2>&1 && b="pass" || b="fail"; }

        # Lint - capturar output para contar warnings
        if [ "$SKIP_LINT" = false ]; then
            lint_output=$(npm run lint 2>&1)
            lint_exit=$?
            if [ $lint_exit -eq 0 ]; then
                l="pass"
            else
                l="fail"
            fi
            lint_warnings=$(count_lint_warnings "$lint_output")
        fi

        # Tests con cobertura
        if [ "$SKIP_TESTS" = false ]; then
            if [ "$project" = "graf-backend" ]; then
                # Jest coverage para backend
                test_output=$(npm run test:cov 2>&1)
                test_exit=$?
                if [ $test_exit -eq 0 ]; then
                    t="pass"
                else
                    t="fail"
                fi
                coverage=$(extract_jest_coverage "$test_output" "$ROOT_DIR/$project")
                test_summary=$(extract_test_summary "$test_output" "jest")
            else
                # Vitest coverage para admin y client (con reportOnFailure para generar cobertura incluso con fallos)
                test_output=$(npx vitest run --coverage --coverage.reportOnFailure 2>&1)
                test_exit=$?
                if [ $test_exit -eq 0 ]; then
                    t="pass"
                else
                    t="fail"
                fi
                coverage=$(extract_vitest_coverage "$test_output" "$ROOT_DIR/$project")
                test_summary=$(extract_test_summary "$test_output" "vitest")
            fi
        fi

        # Validación de Enums
        if [ -f "scripts/validate-string-to-enum.ts" ]; then
            npx tsx scripts/validate-string-to-enum.ts >/dev/null 2>&1

            # Leer el reporte JSON si existe
            if [ -f "enum-validation-report.json" ]; then
                # Extraer datos del JSON sin jq
                total_enums=$(grep -o '"totalEnums"[[:space:]]*:[[:space:]]*[0-9]*' enum-validation-report.json | grep -oE '[0-9]+' | head -1)
                unused_enums=$(grep -o '"unusedEnums"[[:space:]]*:[[:space:]]*[0-9]*' enum-validation-report.json | grep -oE '[0-9]+' | head -1)
                hardcoded=$(grep -o '"missingEnumOccurrences"[[:space:]]*:[[:space:]]*[0-9]*' enum-validation-report.json | grep -oE '[0-9]+' | head -1)

                # Si no se encontraron valores, usar 0
                [ -z "$total_enums" ] && total_enums=0
                [ -z "$unused_enums" ] && unused_enums=0
                [ -z "$hardcoded" ] && hardcoded=0

                echo "$total_enums $unused_enums $hardcoded" > "$TEMP_DIR/${project}.enums"
            else
                echo "0 0 0" > "$TEMP_DIR/${project}.enums"
            fi
        else
            echo "0 0 0" > "$TEMP_DIR/${project}.enums"
        fi

        echo "$b $l $t" > "$TEMP_DIR/$project"
        echo "$lint_warnings" > "$TEMP_DIR/${project}.lint_warnings"
        echo "$coverage" > "$TEMP_DIR/${project}.coverage"
        echo "$test_summary" > "$TEMP_DIR/${project}.test_summary"
        echo "done" > "$TEMP_DIR/${project}.status"
    ) &
done

# Monitorear progreso
echo -e "${YELLOW}  ⏳ Ejecutando validaciones en paralelo...${NC}"
echo ""

while true; do
    done_count=0
    status_line=""
    
    for project in graf-admin graf-backend graf-client; do
        if [ -f "$TEMP_DIR/${project}.status" ] && [ "$(cat "$TEMP_DIR/${project}.status")" = "done" ]; then
            status_line="${status_line}${GREEN}●${NC} "
            ((done_count++))
        else
            status_line="${status_line}${YELLOW}○${NC} "
        fi
    done
    
    printf "\r  Progreso: ${status_line}($done_count/3 completados)  "
    
    [ $done_count -eq 3 ] && break
    sleep 1
done

echo ""
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  📊 RESULTADOS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

PASS=0; FAIL=0; SKIP=0
EXIT_CODE=0
TOTAL_WARNINGS=0

for project in graf-admin graf-backend graf-client; do
    echo -e "  ${CYAN}📦 $project${NC}"
    
    if [ -f "$TEMP_DIR/$project" ]; then
        read -r build lint test < "$TEMP_DIR/$project"
        
        # Leer warnings de lint (sanitizar a número)
        lint_warnings=0
        if [ -f "$TEMP_DIR/${project}.lint_warnings" ]; then
            raw_warnings=$(cat "$TEMP_DIR/${project}.lint_warnings" | tr -d '\n' | grep -oE '^[0-9]+' | head -1)
            [ -n "$raw_warnings" ] && lint_warnings=$raw_warnings
            TOTAL_WARNINGS=$((TOTAL_WARNINGS + lint_warnings))
        fi
        
        # Leer cobertura
        coverage="- - - -"
        if [ -f "$TEMP_DIR/${project}.coverage" ]; then
            coverage=$(cat "$TEMP_DIR/${project}.coverage")
        fi
        
        case $build in
            pass) echo -e "     ${GREEN}✓${NC} build"; ((PASS++)) ;;
            fail) echo -e "     ${RED}✗${NC} build"; ((FAIL++)); EXIT_CODE=1 ;;
            skip) echo -e "     ${YELLOW}○${NC} build (skip)"; ((SKIP++)) ;;
        esac
        
        case $lint in
            pass) 
                if [ "$lint_warnings" -gt 0 ] 2>/dev/null; then
                    echo -e "     ${GREEN}✓${NC} lint ${YELLOW}(${lint_warnings} warnings)${NC}"
                else
                    echo -e "     ${GREEN}✓${NC} lint"
                fi
                ((PASS++)) 
                ;;
            fail) 
                if [ "$lint_warnings" -gt 0 ] 2>/dev/null; then
                    echo -e "     ${RED}✗${NC} lint ${YELLOW}(${lint_warnings} warnings)${NC}"
                else
                    echo -e "     ${RED}✗${NC} lint"
                fi
                ((FAIL++)); EXIT_CODE=1 
                ;;
            skip) echo -e "     ${YELLOW}○${NC} lint (skip)"; ((SKIP++)) ;;
        esac
        
        case $test in
            pass) 
                test_summary=""
                if [ -f "$TEMP_DIR/${project}.test_summary" ]; then
                    test_summary=$(cat "$TEMP_DIR/${project}.test_summary")
                fi
                if [ -n "$test_summary" ]; then
                    echo -e "     ${GREEN}✓${NC} test ${CYAN}(${test_summary})${NC}"
                else
                    echo -e "     ${GREEN}✓${NC} test"
                fi
                ((PASS++)) 
                ;;
            fail) 
                test_summary=""
                if [ -f "$TEMP_DIR/${project}.test_summary" ]; then
                    test_summary=$(cat "$TEMP_DIR/${project}.test_summary")
                fi
                if [ -n "$test_summary" ]; then
                    echo -e "     ${RED}✗${NC} test ${CYAN}(${test_summary})${NC}"
                else
                    echo -e "     ${RED}✗${NC} test"
                fi
                ((FAIL++)); EXIT_CODE=1 
                ;;
            skip) echo -e "     ${YELLOW}○${NC} test (skip)"; ((SKIP++)) ;;
        esac
        
        # Mostrar cobertura si está disponible
        if [ "$test" != "skip" ] && [ "$coverage" != "- - - -" ]; then
            read -r stmts branch funcs lines <<< "$coverage"
            if [ "$stmts" != "-" ]; then
                echo -e "     ${MAGENTA}📈${NC} Coverage: Stmts ${stmts}% | Branch ${branch}% | Funcs ${funcs}% | Lines ${lines}%"
            fi
        fi
    else
        echo -e "     ${RED}✗${NC} error: no results"
        EXIT_CODE=1
    fi
    echo ""
done

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "  ${GREEN}✓${NC} Pass: $PASS  |  ${RED}✗${NC} Fail: $FAIL  |  ${YELLOW}○${NC} Skip: $SKIP"
if [ $TOTAL_WARNINGS -gt 0 ]; then
    echo -e "  ${YELLOW}⚠${NC}  Total Lint Warnings: $TOTAL_WARNINGS"
fi
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Resumen de cobertura consolidado
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  📊 RESUMEN DE COBERTURA${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
printf "  ${CYAN}%-15s${NC} %8s %8s %8s %8s\n" "Proyecto" "Stmts" "Branch" "Funcs" "Lines"
echo -e "  ─────────────────────────────────────────────────────────"

for project in graf-admin graf-backend graf-client; do
    if [ -f "$TEMP_DIR/${project}.coverage" ]; then
        coverage=$(cat "$TEMP_DIR/${project}.coverage")
        read -r stmts branch funcs lines <<< "$coverage"
        if [ "$stmts" != "-" ]; then
            # Colorear según porcentaje
            color_stmts=$GREEN; color_branch=$GREEN; color_funcs=$GREEN; color_lines=$GREEN
            [ "${stmts%.*}" -lt 80 ] 2>/dev/null && color_stmts=$YELLOW
            [ "${stmts%.*}" -lt 50 ] 2>/dev/null && color_stmts=$RED
            [ "${branch%.*}" -lt 80 ] 2>/dev/null && color_branch=$YELLOW
            [ "${branch%.*}" -lt 50 ] 2>/dev/null && color_branch=$RED
            [ "${funcs%.*}" -lt 80 ] 2>/dev/null && color_funcs=$YELLOW
            [ "${funcs%.*}" -lt 50 ] 2>/dev/null && color_funcs=$RED
            [ "${lines%.*}" -lt 80 ] 2>/dev/null && color_lines=$YELLOW
            [ "${lines%.*}" -lt 50 ] 2>/dev/null && color_lines=$RED
            
            printf "  %-15s ${color_stmts}%7s%%${NC} ${color_branch}%7s%%${NC} ${color_funcs}%7s%%${NC} ${color_lines}%7s%%${NC}\n" \
                "$project" "$stmts" "$branch" "$funcs" "$lines"
        else
            printf "  %-15s %8s %8s %8s %8s\n" "$project" "-" "-" "-" "-"
        fi
    else
        printf "  %-15s %8s %8s %8s %8s\n" "$project" "skip" "skip" "skip" "skip"
    fi
done
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Resumen de validación de Enums
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  🔤 RESUMEN DE ENUMS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
printf "  ${CYAN}%-15s${NC} %10s %10s %15s\n" "Proyecto" "Total" "Sin Uso" "Hardcoded"
echo -e "  ─────────────────────────────────────────────────────────"

TOTAL_ENUMS_ALL=0
TOTAL_UNUSED_ALL=0
TOTAL_HARDCODED_ALL=0

for project in graf-admin graf-backend graf-client; do
    if [ -f "$TEMP_DIR/${project}.enums" ]; then
        read -r total_enums unused_enums hardcoded < "$TEMP_DIR/${project}.enums"

        # Sanitizar valores
        [ -z "$total_enums" ] && total_enums=0
        [ -z "$unused_enums" ] && unused_enums=0
        [ -z "$hardcoded" ] && hardcoded=0

        TOTAL_ENUMS_ALL=$((TOTAL_ENUMS_ALL + total_enums))
        TOTAL_UNUSED_ALL=$((TOTAL_UNUSED_ALL + unused_enums))
        TOTAL_HARDCODED_ALL=$((TOTAL_HARDCODED_ALL + hardcoded))

        # Colorear según estado
        color_total=$GREEN
        color_unused=$GREEN
        color_hardcoded=$GREEN

        [ "$unused_enums" -gt 0 ] 2>/dev/null && color_unused=$YELLOW
        [ "$unused_enums" -gt 5 ] 2>/dev/null && color_unused=$RED

        [ "$hardcoded" -gt 0 ] 2>/dev/null && color_hardcoded=$YELLOW
        [ "$hardcoded" -gt 10 ] 2>/dev/null && color_hardcoded=$RED

        printf "  %-15s ${color_total}%10d${NC} ${color_unused}%10d${NC} ${color_hardcoded}%15d${NC}\n" \
            "$project" "$total_enums" "$unused_enums" "$hardcoded"
    else
        printf "  %-15s %10s %10s %15s\n" "$project" "-" "-" "-"
    fi
done

echo -e "  ─────────────────────────────────────────────────────────"
printf "  ${MAGENTA}%-15s %10d %10d %15d${NC}\n" "TOTAL" "$TOTAL_ENUMS_ALL" "$TOTAL_UNUSED_ALL" "$TOTAL_HARDCODED_ALL"

echo ""
if [ $TOTAL_HARDCODED_ALL -eq 0 ] && [ $TOTAL_UNUSED_ALL -eq 0 ]; then
    echo -e "  ${GREEN}✅${NC} Estado de Enums: LIMPIO - Todos los enums están correctamente usados"
elif [ $TOTAL_HARDCODED_ALL -eq 0 ]; then
    echo -e "  ${YELLOW}⚠${NC}  Estado de Enums: ${TOTAL_UNUSED_ALL} enum(s) sin uso"
elif [ $TOTAL_HARDCODED_ALL -le 10 ]; then
    echo -e "  ${YELLOW}⚠${NC}  Estado de Enums: ${TOTAL_HARDCODED_ALL} string(s) hardcoded, ${TOTAL_UNUSED_ALL} enum(s) sin uso"
else
    echo -e "  ${RED}❌${NC} Estado de Enums: ${TOTAL_HARDCODED_ALL} string(s) hardcoded, ${TOTAL_UNUSED_ALL} enum(s) sin uso"
fi

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

rm -rf "$TEMP_DIR"

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}  ✅ VALIDACIÓN EXITOSA${NC}"
else
    echo -e "${RED}  ❌ VALIDACIÓN FALLIDA${NC}"
fi

exit $EXIT_CODE
