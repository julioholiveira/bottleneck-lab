#!/usr/bin/env python3
"""
Teste de Carga
Objetivo: Validar o comportamento do Bottleneck com MAX_CONCURRENT=200
"""
import subprocess
import json
import time
import csv
from datetime import datetime
from threading import Thread

# Configurações
MESSAGES_COUNT = 50000
SNAPSHOT_INTERVAL = 2  # segundos (aumentado para reduzir overhead)
MAX_SNAPSHOTS = 600  # 20 minutos máximo

# Com 100ms delay: 200 concurrent * (1000ms/100ms) = 2000 msg/s teórico
# Throughput real esperado: ~1000-1500 msg/s
EXPECTED_THROUGHPUT = 1200  # msg/s

print("=" * 80)
print("TESTE DE CARGA EXTREMO - BOTTLENECK LAB (50K MENSAGENS)")
print("=" * 80)
print(f"Mensagens: {MESSAGES_COUNT:,}")
print(f"MAX_CONCURRENT configurado: 200")
print(f"Delay por mensagem: 100ms")
print(f"Throughput esperado: ~{EXPECTED_THROUGHPUT} msg/s")
print(f"Tempo estimado: ~{MESSAGES_COUNT / EXPECTED_THROUGHPUT:.0f} segundos (~{MESSAGES_COUNT / EXPECTED_THROUGHPUT / 60:.1f} minutos)")
print("=" * 80)
print()

# Limpar a fila primeiro
print("Limpando fila do RabbitMQ...")
subprocess.run(
    ["curl", "-s", "-u", "guest:guest", "-X", "DELETE",
     "http://localhost:15672/api/queues/%2F/bottleneck-queue/contents"],
    capture_output=True
)
time.sleep(2)
print("✓ Fila limpa")
print()

# Preparar arquivo CSV para salvar os dados
csv_file = f"test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
csv_writer = None
csv_fp = open(csv_file, 'w', newline='')
csv_writer = csv.writer(csv_fp)
csv_writer.writerow([
    'snapshot', 'timestamp', 'elapsed_seconds', 
    'messages_total', 'messages_ready', 'messages_unacknowledged',
    'consumers', 'processed_count'
])

snapshots = []
producer_finished = False

def monitor_queue():
    """Função que monitora a fila continuamente"""
    snapshot_num = 0
    start_time = time.time()
    
    print("Iniciando monitoramento...")
    print()
    print(f"{'#':>4} | {'Time':>8} | {'Elapsed':>7} | {'Total':>6} | {'Ready':>6} | {'Unack':>6} | {'Processed':>9}")
    print("-" * 80)
    
    while snapshot_num < MAX_SNAPSHOTS:
        snapshot_num += 1
        elapsed = time.time() - start_time
        timestamp = datetime.now().strftime("%H:%M:%S")
        
        # Consultar RabbitMQ
        try:
            result = subprocess.run(
                ["curl", "-s", "-u", "guest:guest", 
                 "http://localhost:15672/api/queues/%2F/bottleneck-queue"],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                data = json.loads(result.stdout)
                
                # Tentar ler consumer log para número de processadas
                processed = 0
                try:
                    # Tentar múltiplos arquivos de log
                    log_files = [
                        "/Users/juliohenrique/work/bottleneck_lab/consumer-50k.log",
                        "/Users/juliohenrique/work/bottleneck_lab/consumer-5k.log",
                        "/Users/juliohenrique/work/bottleneck_lab/consumer-test.log",
                        "/Users/juliohenrique/work/bottleneck_lab/consumer-final.log"
                    ]
                    for log_file in log_files:
                        try:
                            with open(log_file, "r") as f:
                                for line in reversed(list(f)):
                                    if "Processed:" in line:
                                        # Extrair número: "Processed: 123"
                                        parts = line.split("Processed:")
                                        if len(parts) > 1:
                                            num_str = parts[1].split(",")[0].strip()
                                            processed = int(num_str)
                                        break
                            if processed > 0:
                                break
                        except FileNotFoundError:
                            continue
                except:
                    pass
                
                snapshot = {
                    'num': snapshot_num,
                    'timestamp': timestamp,
                    'elapsed': elapsed,
                    'messages_total': data.get("messages", 0),
                    'messages_ready': data.get("messages_ready", 0),
                    'messages_unacknowledged': data.get("messages_unacknowledged", 0),
                    'consumers': data.get("consumers", 0),
                    'processed': processed
                }
                
                snapshots.append(snapshot)
                
                # Escrever no CSV
                csv_writer.writerow([
                    snapshot_num, timestamp, f"{elapsed:.1f}",
                    snapshot['messages_total'], snapshot['messages_ready'],
                    snapshot['messages_unacknowledged'], snapshot['consumers'],
                    snapshot['processed']
                ])
                csv_fp.flush()
                
                # Imprimir linha
                print(f"{snapshot_num:4d} | {timestamp:>8} | {elapsed:6.1f}s | "
                      f"{snapshot['messages_total']:6d} | {snapshot['messages_ready']:6d} | "
                      f"{snapshot['messages_unacknowledged']:6d} | {snapshot['processed']:9d}")
                
                # Verificar se terminou
                if (producer_finished and snapshot['messages_total'] == 0 and 
                    snapshot['processed'] >= MESSAGES_COUNT):
                    print()
                    print("✓ Processamento concluído!")
                    break
                    
        except Exception as e:
            print(f"Erro no snapshot {snapshot_num}: {e}")
        
        time.sleep(SNAPSHOT_INTERVAL)
    
    csv_fp.close()

# Iniciar monitoramento em thread separada
monitor_thread = Thread(target=monitor_queue, daemon=True)
monitor_thread.start()

# Aguardar um pouco para o monitoramento começar
time.sleep(2)

# Iniciar o producer
print()
print(f"Iniciando producer com {MESSAGES_COUNT} mensagens...")
print()

producer_start = time.time()
producer_process = subprocess.Popen(
    ["npm", "run", "producer", "--", "--count", str(MESSAGES_COUNT)],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    cwd="/Users/juliohenrique/work/bottleneck_lab"
)

# Aguardar o producer terminar
producer_process.wait()
producer_end = time.time()
producer_finished = True

print()
print(f"✓ Producer finalizado em {producer_end - producer_start:.1f}s")
print()

# Aguardar o monitor terminar
monitor_thread.join(timeout=60)

# Análise dos resultados
print()
print("=" * 80)
print("ANÁLISE DOS RESULTADOS")
print("=" * 80)
print()

if snapshots:
    max_unack = max(s['messages_unacknowledged'] for s in snapshots)
    max_ready = max(s['messages_ready'] for s in snapshots)
    max_total = max(s['messages_total'] for s in snapshots)
    
    # Encontrar momento do pico
    peak_snapshot = max(snapshots, key=lambda s: s['messages_unacknowledged'])
    
    print(f"Mensagens enviadas: {MESSAGES_COUNT}")
    print(f"Mensagens processadas: {snapshots[-1]['processed']}")
    print(f"Taxa de sucesso: {(snapshots[-1]['processed'] / MESSAGES_COUNT * 100):.1f}%")
    print()
    print(f"Pico de mensagens na fila (Total): {max_total}")
    print(f"Pico de mensagens prontas (Ready): {max_ready}")
    print(f"Pico de mensagens não confirmadas (Unack): {max_unack}")
    print()
    print(f"Momento do pico de Unack:")
    print(f"  - Timestamp: {peak_snapshot['timestamp']}")
    print(f"  - Elapsed: {peak_snapshot['elapsed']:.1f}s")
    print(f"  - Unacknowledged: {peak_snapshot['messages_unacknowledged']}")
    print()
    
    # Verificar se está dentro do limite
    print("VALIDAÇÃO DO MAX_CONCURRENT:")
    if max_unack > 0:
        print(f"✓ Bottleneck observado em ação!")
        print(f"  - Máximo de {max_unack} mensagens processando simultaneamente")
        
        if max_unack <= 200:
            print(f"  - ✓ Dentro do limite configurado (MAX_CONCURRENT = 200)")
            efficiency = (max_unack / 200) * 100
            print(f"  - Eficiência: {efficiency:.1f}% do limite")
        elif max_unack <= 220:  # Pequena margem para overhead
            print(f"  - ⚠ Próximo do limite (margem de overhead aceitável)")
        else:
            print(f"  - ✗ ATENÇÃO: Ultrapassou significativamente o limite!")
    else:
        print("⚠ Não foi possível observar o Bottleneck limitando")
    
    print()
    print(f"Tempo total de processamento: {snapshots[-1]['elapsed']:.1f}s")
    print(f"Throughput médio: {snapshots[-1]['processed'] / snapshots[-1]['elapsed']:.2f} msg/s")
    print()
    print(f"Dados salvos em: {csv_file}")
    print()

print("=" * 80)
