<?php
// Enable CORS for Flutter app
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db.php';

// Get query parameter for status filtering
$status = $_GET['status'] ?? '';

// Build query - MUST include image_url for Flutter app to display images
$query = "SELECT 
    id, 
    name, 
    description, 
    cuisine_type, 
    image_url, 
    banner_url,
    delivery_fee, 
    address, 
    is_open, 
    status,
    rating, 
    review_count, 
    delivery_time, 
    opening_hours, 
    min_order_amount,
    created_at,
    updated_at
FROM restaurants";

if (!empty($status)) {
    $query .= " WHERE status = :status";
}

$query .= " ORDER BY id DESC";

try {
    $stmt = $pdo->prepare($query);
    
    if (!empty($status)) {
        $stmt->bindParam(':status', $status, PDO::PARAM_STR);
    }
    
    $stmt->execute();
    $restaurants = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Return JSON response
    header('Content-Type: application/json');
    echo json_encode($restaurants, JSON_PRETTY_PRINT);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
